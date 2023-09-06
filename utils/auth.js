export default function extractBasicCredentials(base64) {
  const credentials = Buffer.from(base64, 'base64').split(':');
  return { email: credentials[0], password: credentials[1] };
}
