import "dotenv/config";

async function main() {
  if (process.env.DEMO_MODE !== "true") {
    console.error("Refusing to seed demo data because DEMO_MODE is not true.");
    console.error("Set DEMO_MODE=true only for hosted demo or pilot environments.");
    process.exit(1);
  }

  await import("./seed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
