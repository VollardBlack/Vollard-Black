export function isAuthorized(request) {
  const key = request.headers.get('x-admin-key');
  return Boolean(process.env.ADMIN_PASSCODE) && key === process.env.ADMIN_PASSCODE;
}
