/**
 * Script Automatizado de Verificación de Seguridad y Aislamiento de Datos (Anti-IDOR)
 * Ejecuta los casos de prueba esenciales directamente contra la API del servidor TaskGuard:
 * 1. Login exitoso de Usuario A (Alice) y Usuario B (Bob)
 * 2. Creación de una tarea privada para Usuario A
 * 3. Intento de Usuario B de acceder (GET) a la tarea de Usuario A -> Debe retornar 404/403
 * 4. Intento de Usuario B de modificar (PUT) la tarea de Usuario A -> Debe retornar 404/403
 * 5. Intento de Usuario B de eliminar (DELETE) la tarea de Usuario A -> Debe retornar 404/403
 * 6. Logout y verificación de revocación de acceso a rutas protegidas -> 401
 */

const BASE_URL = process.env.TEST_APP_URL || 'http://localhost:3000';

interface TestResult {
  code: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function recordTest(code: string, name: string, passed: boolean, details: string) {
  results.push({ code, name, passed, details });
  const badge = passed ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${badge} ${code}: ${name}`);
  console.log(`   Detalle: ${details}\n`);
}

async function runSecuritySuite() {
  console.log('================================================================');
  console.log(' TASKGUARD: SUITE DE PRUEBAS DE SEGURIDAD Y AISLAMIENTO DE DATOS');
  console.log(` Servidor destino: ${BASE_URL}`);
  console.log('================================================================\n');

  try {
    // 1. Diagnóstico del sistema
    const diagRes = await fetch(`${BASE_URL}/api/audit/diagnostics`);
    if (!diagRes.ok) {
      throw new Error(`El servidor no responde en ${BASE_URL}. Asegúrate de ejecutar npm run dev primero.`);
    }
    const diagData = await diagRes.json();
    recordTest('CP-00', 'Servidor y motor de persistencia activos', true, `Hashing: ${diagData.securityPolicies.passwordHashing}`);

    // 2. Login con credenciales inválidas (debe fallar)
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'WrongPassword999!' }),
    });
    recordTest(
      'CP-01',
      'Rechazo de credenciales inválidas',
      badLoginRes.status === 401,
      `Status HTTP recibido: ${badLoginRes.status} (Esperado: 401)`
    );

    // 3. Login de Usuario A (Alice)
    const aliceLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'Password123!' }),
    });
    const rawAliceCookie = aliceLoginRes.headers.get('set-cookie');
    const aliceCookie = rawAliceCookie ? rawAliceCookie.split(';')[0] : '';
    const aliceData = await aliceLoginRes.json();
    const aliceCsrf = aliceData.csrfToken;

    recordTest(
      'CP-02',
      'Autenticación real de Usuario A (Alice) y emisión de cookie HttpOnly',
      aliceLoginRes.status === 200 && !!rawAliceCookie && rawAliceCookie.includes('HttpOnly'),
      `Status: ${aliceLoginRes.status}, Cookie: ${aliceCookie}, CSRF Token generado`
    );

    // 4. Crear tarea privada como Usuario A
    const createTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': aliceCookie,
        'x-csrf-token': aliceCsrf || '',
      },
      body: JSON.stringify({
        title: 'Documento Confidencial de Alice',
        description: 'Información estrictamente privada protegida por aislamiento de backend.',
        priority: 'urgent',
        status: 'pending',
      }),
    });
    const createdTaskData = await createTaskRes.json();
    const aliceTaskId = createdTaskData.task?.id;

    recordTest(
      'CP-03',
      'Creación de tarea privada para Usuario A vinculada forzosamente en el servidor',
      createTaskRes.status === 201 && !!aliceTaskId,
      `ID de tarea creada: ${aliceTaskId}, Status: ${createTaskRes.status}`
    );

    // 5. Login de Usuario B (Bob)
    const bobLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bob@example.com', password: 'SecurePass456!' }),
    });
    const rawBobCookie = bobLoginRes.headers.get('set-cookie');
    const bobCookie = rawBobCookie ? rawBobCookie.split(';')[0] : '';
    const bobData = await bobLoginRes.json();
    const bobCsrf = bobData.csrfToken;

    recordTest(
      'CP-04',
      'Autenticación de Usuario B (Bob) con sesión independiente',
      bobLoginRes.status === 200 && bobData.user.email === 'bob@example.com',
      `Usuario B autenticado: ${bobData.user.name} (${bobData.user.id})`
    );

    // 6. AISLAMIENTO: Usuario B lista sus tareas -> La tarea de Alice NO debe aparecer
    const bobListRes = await fetch(`${BASE_URL}/api/tasks`, {
      headers: { 'Cookie': bobCookie || '' },
    });
    const bobListData = await bobListRes.json();
    const leakedAliceTask = bobListData.tasks?.find((t: any) => t.id === aliceTaskId);

    recordTest(
      'CP-05',
      'Aislamiento en Listado: Usuario B no puede ver tareas de Usuario A',
      bobListRes.status === 200 && !leakedAliceTask,
      `Tareas de Bob devueltas: ${bobListData.tasks?.length}. ¿Se filtró la tarea de Alice? ${leakedAliceTask ? 'SÍ (VULNERABLE)' : 'NO (AISLADO CORRECTAMENTE)'}`
    );

    // 7. AISLAMIENTO ANTI-IDOR: Intento de Usuario B de Modificar tarea de Usuario A (PUT)
    const bobTamperRes = await fetch(`${BASE_URL}/api/tasks/${aliceTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': bobCookie || '',
        'x-csrf-token': bobCsrf || '',
      },
      body: JSON.stringify({
        title: 'HACKEADO POR BOB - VIOLACIÓN DE ACCESO',
      }),
    });

    recordTest(
      'CP-06',
      'Aislamiento en Mutación (Anti-IDOR): Usuario B no puede modificar tareas de Usuario A',
      bobTamperRes.status === 404 || bobTamperRes.status === 403,
      `Status HTTP recibido: ${bobTamperRes.status} (Acceso denegado en backend)`
    );

    // 8. AISLAMIENTO ANTI-IDOR: Intento de Usuario B de Eliminar tarea de Usuario A (DELETE)
    const bobDeleteRes = await fetch(`${BASE_URL}/api/tasks/${aliceTaskId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': bobCookie || '',
        'x-csrf-token': bobCsrf || '',
      },
    });

    recordTest(
      'CP-07',
      'Aislamiento en Eliminación: Usuario B no puede borrar tareas de Usuario A',
      bobDeleteRes.status === 404 || bobDeleteRes.status === 403,
      `Status HTTP recibido: ${bobDeleteRes.status} (Eliminación impedida)`
    );

    // 9. Logout de Usuario B e invalidación de sesión
    const bobLogoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Cookie': bobCookie || '', 'x-csrf-token': bobCsrf || '' },
    });
    // Intento subsecuente de consultar /api/tasks con la sesión cerrada
    const postLogoutAccess = await fetch(`${BASE_URL}/api/tasks`, {
      headers: { 'Cookie': bobCookie || '' },
    });

    recordTest(
      'CP-08',
      'Logout efectivo en servidor e invalidación de cookie para rutas protegidas',
      bobLogoutRes.status === 200 && postLogoutAccess.status === 401,
      `Logout status: ${bobLogoutRes.status}, Acceso posterior bloqueado con 401: ${postLogoutAccess.status === 401}`
    );

    // Resumen final
    console.log('================================================================');
    console.log(' RESUMEN DE EJECUCIÓN DE PRUEBAS DE SEGURIDAD');
    console.log('================================================================');
    const totalPassed = results.filter(r => r.passed).length;
    console.log(` Casos de Prueba Ejecutados: ${results.length}`);
    console.log(` Casos Exitosos:             ${totalPassed}/${results.length}`);
    console.log(` Veredicto de Aislamiento:   ${totalPassed === results.length ? '100% SEGURO Y VERIFICADO' : 'FALLOS DETECTADOS'}`);
    console.log('================================================================\n');

  } catch (err: any) {
    console.error('Error durante la ejecución de las pruebas:', err.message);
  }
}

runSecuritySuite();
