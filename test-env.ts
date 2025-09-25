#!/usr/bin/env ts-node
import { log, error, emoji, getHeader, OUTPUT_CONFIG } from './src/utils/championship-style';

console.log('=== Testing Environment Variables ===\n');

console.log('Current settings:');
console.log('FAF_QUIET:', OUTPUT_CONFIG.quiet);
console.log('FAF_NO_EMOJI:', OUTPUT_CONFIG.noEmoji);
console.log('FAF_VERBOSE:', OUTPUT_CONFIG.verbose);
console.log('');

console.log('--- Test 1: Normal output ---');
log('This is a normal log message with emoji ' + emoji('🚀', '[rocket]'));

console.log('\n--- Test 2: Header ---');
console.log(getHeader());

console.log('\n--- Test 3: Emoji function ---');
console.log('Rocket emoji:', emoji('🚀', 'ROCKET'));
console.log('Trophy emoji:', emoji('🏆', 'TROPHY'));

console.log('\n--- Test 4: Error output ---');
error('This is an error message');

console.log('\n=== Tests Complete ===');