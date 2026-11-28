import { SITE } from "@/lib/config";
import { getLiveCategories, getProducts } from "@/lib/content";
import { FOUNDERS } from "@/lib/team";

/**
 * llms.txt: a plain summary of the site for AI assistants and answer engines, so they describe
 * Timule accurately and link to the right pages. See llmstxt.org.
 */
export const dynamic = "force-static";

export function GET() {
  const u = (p: string) => `${SITE.url}${p}`;
  const body = `# Timule

> Timule supplies critical components made in India for drones, robots and data centers, under one TM part code and one invoice, with evidence of where each part was made and how it was checked. Drones: BLDC motors, ESCs, propellers, flight controllers, GNSS modules and carbon-fibre frames. Robotics: robot joint actuators and AGV/AMR drive wheels. Data centers: server fans, server power supplies and liquid cooling. Energy storage, chips and sensors, and transformers are coming next. Indian drone makers use Timule to meet "no foreign components" and indigenous-content rules for the armed forces and Kisan (farm) drone schemes; robotics and data center teams use it for traceable, locally made alternatives to imported parts.

Timule is not only a drone parts supplier: it is a supply layer for critical components across drones, robotics and data centers.

Timule is based in India. It sources from qualified Indian manufacturers, tests every batch before it ships against the acceptance bands on the part's build sheet, releasing only parts that pass every band (top grade only; the rest are rejected), backed by documents, its own measurements and outside lab tests, and sells under its own TM code so a buyer has one accountable seller and a backup maker. Makers are identified by TMS supplier codes, not names.

## Sectors
- [Drones, robotics and data centers](${u("/sectors")})

## Free engineering tools (for drone teams)
- [Indigenous content calculator](${u("/tools/content")}): paste a drone parts list and get its Indian content by cost (DAP 2020 method) against 50, 60 or 100 percent targets, with every foreign critical part flagged.
- [Propulsion sizing](${u("/tools/sizing")}): weight, rotors, propeller and battery in; a matched motor, ESC and propeller, hover time and currents out, corrected for air density in Indian heat and altitude.
- [CAD and flight-controller files](${u("/tools/files")}): STL envelopes and 1:1 DXF drilling drawings for motors, ESCs and propellers, and ArduPilot and PX4 starting parameters.
- [Firmware origin records](${u("/tools/firmware")}): fingerprint ESC and flight-controller firmware with its chip, source and licence; Timule seals checked records.

## Configure a part
- [BLDC motor configurator](${u("/configure/motor")}): 28 standard stator frames and every option, giving one TM code and build string.
- [ESC configurator](${u("/configure/esc")}) and [propeller configurator](${u("/configure/propeller")}).

## Catalogue
${getLiveCategories()
  .map((c) => `- [${c.name}](${u(`/categories/${c.id}`)})`)
  .join("\n")}
${getProducts()
  .filter((p) => p.status === "live")
  .map((p) => `- [${p.code}: ${p.name}](${u(`/parts/${p.id}`)})`)
  .join("\n")}

## Company
- [About Timule and the founders](${u("/about")}): ${FOUNDERS.map((f) => `${f.name} (${f.role}, ${f.focus.toLowerCase()})`).join("; ")}.
- [For investors](${u("/investors")})
- [How evidence tiers work](${u("/methodology")})
- [TM code system](${u("/codes")})
- [Send a sourcing request](${u("/request")}) · [Suppliers: apply](${u("/suppliers/join")})
- Contact: ${SITE.contactEmail}
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
