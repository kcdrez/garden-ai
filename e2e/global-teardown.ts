export default async function globalTeardown() {
  // Stack is managed externally (docker compose down -v) by the CI workflow
  // or manually by the developer. Nothing to do here.
}
