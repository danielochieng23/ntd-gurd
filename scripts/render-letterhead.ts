/** Rasterise page 1 of the alert report so the letterhead can be eyeballed. */
import { writeFileSync } from 'fs';
import { pdf } from 'pdf-to-img';
import { generateReport } from '../lib/pdf';
import { getCurrentState, ALERTS, INTERVENTIONS, WATER_SENSORS } from '../lib/data';

(async () => {
  const { doc } = generateReport({
    kind: 'alert',
    alert: ALERTS[0],
    ctx: {
      communities: getCurrentState(),
      alerts: ALERTS,
      interventions: INTERVENTIONS,
      sensors: WATER_SENSORS,
      weather: null,
      author: 'Busia District Health Office',
    },
  });

  const buf = Buffer.from(doc.output('arraybuffer') as ArrayBuffer);
  writeFileSync('scripts/letterhead.pdf', buf);

  const pages = await pdf(buf, { scale: 2.4 });
  let n = 0;
  for await (const page of pages) {
    n++;
    writeFileSync(`scripts/letterhead-p${n}.png`, page);
    if (n === 1) console.log(`page 1 rendered: ${page.length.toLocaleString()} bytes`);
  }
  console.log(`${n} page(s) rasterised`);
})();
