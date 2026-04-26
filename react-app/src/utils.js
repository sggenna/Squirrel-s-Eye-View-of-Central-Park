import { BC } from './constants';

export function pct(arr, key) {
  return arr.length ? +(arr.filter(s => s[key]).length / arr.length * 100).toFixed(1) : 0;
}

export function colorFn(s) {
  if (s.runs_from) return BC.runs_from;
  if (s.approaches) return BC.approaches;
  if (s.indifferent) return BC.indifferent;
  if (s.foraging || s.eating) return BC.foraging;
  return '#A09080';
}
