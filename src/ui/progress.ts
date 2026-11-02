import { dim, plainOnStderr } from './colors.js';

/** Simple spinner for async operations. It draws on stderr, so only when
 *  stderr is a terminal: a file or a pipe gets no frames. */
export function spinner(label: string): { stop: (msg?: string) => void } {
  const frames = ['·', '··', '···'];
  let i = 0;
  const interval = process.stderr.isTTY
    ? setInterval(() => {
      process.stderr.write(plainOnStderr(`\r${dim(frames[i++ % frames.length])} ${label}`));
    }, 200)
    : undefined;

  return {
    stop(msg?: string) {
      if (interval) {
        clearInterval(interval);
        process.stderr.write(`\r${  ' '.repeat(label.length + 6)  }\r`);
      }
      if (msg) {console.log(msg);}
    },
  };
}
