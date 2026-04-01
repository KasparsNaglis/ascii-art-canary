import AsciiArt from "./AsciiArt";
import gridData from "./grid-data.json";

// Drop-in usage
export default function Hero() {
  return (
    <section style={{ background: "#113D38", minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <div style={{ flex: 1, padding: "4rem" }}>
        <h1 style={{ color: "#fff", fontSize: "3rem" }}>Your data already has the answers</h1>
      </div>
      <div style={{ flex: 1 }}>
        <AsciiArt
          data={gridData}
          // All optional overrides:
          // bg={[0x11, 0x3d, 0x38]}
          // highlight={[0xf4, 0xf2, 0x7b]}
          // hoverRadius={120}
          // pushForce={40}
        />
      </div>
    </section>
  );
}
