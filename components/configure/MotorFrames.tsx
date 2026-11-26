import Link from "next/link";
import { FRAMES, USE_LABEL, frameDims } from "@/lib/motor-config";

/** Every standard motor frame and winding, each with its Timule code and a link into the configurator. */
export function MotorFrames() {
  const kvCount = FRAMES.reduce((n, f) => n + f.kvs.length, 0);
  return (
    <section aria-labelledby="frames-title" className="mt-20 border-t border-line pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 id="frames-title" className="text-xl font-semibold tracking-tight sm:text-2xl">
            Every standard frame
          </h2>
          <p className="mt-3 text-fg-muted">
            {FRAMES.length} frames and {kvCount} windings that Indian makers build today, each with its own TM code. Pick one to configure the shaft, mounts, magnets, leads and origin.
            Thrust and efficiency are measured on a sample and recorded as evidence, so they are not listed here.
          </p>
        </div>
        <Link href="/configure/motor" className="text-sm text-accent hover:underline">
          Open the configurator
        </Link>
      </div>
      <div className="mt-8 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">Standard BLDC motor frames</caption>
          <thead className="bg-bg-subtle text-xs text-fg-subtle">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Frame
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Stator
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Windings and TM codes
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Propellers
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Used for
              </th>
            </tr>
          </thead>
          <tbody>
            {FRAMES.map((f) => {
              const { d, h } = frameDims(f.size);
              return (
                <tr key={f.size} className="border-t border-line align-top">
                  <th scope="row" className="code-text px-4 py-3 font-semibold">
                    {f.size}
                  </th>
                  <td className="tabular px-4 py-3 text-fg-muted">
                    {d} × {h} mm
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {f.kvs.map((k) => (
                        <Link
                          key={k.kv}
                          href={`/configure/motor?f=${f.size}&kv=${k.kv}`}
                          className="code-text inline-flex min-h-8 items-center rounded-full border border-line px-2.5 text-xs hover:border-fg"
                          title={`Configure TM-MOT-${f.size}-${k.kv}-A`}
                        >
                          TM-MOT-{f.size}-{k.kv}-A <span className="ml-1.5 text-fg-subtle">{k.cells}</span>
                        </Link>
                      ))}
                    </div>
                    {f.partId ? (
                      <Link href={`/parts/${f.partId}`} className="mt-1.5 inline-block text-xs text-accent hover:underline">
                        Listed part with exploded view
                      </Link>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{f.props}</td>
                  <td className="px-4 py-3 text-fg-muted">{f.uses.map((u) => USE_LABEL[u]).join(", ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
