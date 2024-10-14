# fake-ass-commit

## What?

This Deno project creates fake git commits that are time-travelling to the past. It also automatically detects when was the last commit, so you can re-run it periodically too!

## Why?

Recruiters only look at GitHub contributions to rate your skills. It's unfair for those who only work on private projects that aren't even hosted on GitHub, not everyone contributes to open source projects or wants to share source code with the silly microsoft :p

## How?

```sh
deno run --allow-run --allow-write commit.ts --run
```

```
Usage: deno run --allow-run --allow-write commit.ts
  --run|-r
  --filename|-f <filename='dummy.txt'>
  --message|-m <message=Hello>
  --fromDate|-fd <js-date=last-commit>
  --toDate|-td <js-date=today>
  --weekDays|-w <list=1,2,3,4,5)>
  --frequency|-fq <frequency=1-4>
  --algorithm|-a <algorithm='smart'|'random'|'cycle'>
```

```sh
deno run --allow-run --allow-write commit.ts --run --filename silly.md --message "Hello world!!!" --fromDate 2024-01-01 --toDate 2024-02-01 --weekDays 1-5,7 --frequency 1-5 --algorithm smart
```

## Disclaimer

I tested it out, but ehhhh, I'd rather not fake things. So I didn't really test it out properly. My bad! So don't use this shitty script :p
