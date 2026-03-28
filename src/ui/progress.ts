import { dim } from './colors.js';

/** Simple spinner for async operations */
export function spinner(label: string): { stop: (msg?: string) => void } {
  const frames = ['·', '··', '···'];
  let i = 0;
  const interval = setInterval(() => {
    process.stderr.write(`\r${dim(frames[i++ % frames.length])} ${label}`);
  }, 200);

  return {
    stop(msg?: string) {
      clearInterval(interval);
      process.stderr.write(`\r${  ' '.repeat(label.length + 6)  }\r`);
      if (msg) {console.log(msg);}
    },
  };
}
