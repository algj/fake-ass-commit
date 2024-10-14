import { exec } from "https://deno.land/x/exec@0.0.5/mod.ts";

// oh hey, you found the trick behind my tons of commits!
// why I made this? to trick silly recruiters who only look at git history :p
// you can't rate the skill only at looking at git history!
// >:3c

async function generateCommits(commitCount: number, commitMessage: string, customDate: string | Date, filename: string) {
    for (let i = 0; i < commitCount; i++) {
        await Deno.writeTextFile(filename, new Date(customDate).toString());
        await exec("git add .");
        customDate = new Date(customDate);
        await exec(`git commit -m "${commitMessage}" --date "${getFormattedDate(customDate)}"`);
        console.log(`Committed: ${commitMessage} on ${customDate}`);
    }
}

async function getMostRecentCommitDate() {
    try {
        const { output } = await exec("git log -1 --format=%cd");

        // Trim the output to ensure it's clean
        const date = new Date(output.trim());

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            throw new Error("Invalid date retrieved from git log.");
        }

        return date;

    } catch (error) {
        if (error.message.includes("not a git repository")) {
            console.error("Error: Not in a valid git repository.");
            Deno.exit(1);
        }

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return oneYearAgo;
    }
}


if (Deno.args.length == 0) {
    console.log("Usage: deno run --allow-run --allow-write commit.ts --run|-r --filename|-f <filename='dummy.txt'> --message|-m <message=Hello> --fromDate|-fd <js-date=last-commit> --toDate|-td <js-date=today> --weekDays|-w <list=1,2,3,4,5)> --frequency|-fq <frequency=1-4> --algorithm|-a <algorithm='smart'|'random'|'cycle'>\n" +
        "Note: We use sane defaults, no need for any arguments except '-r'");
    Deno.exit(0);
}

let filename = "dummy.txt";
let message = "Hello";
let fromDate = await getMostRecentCommitDate().catch(err => {
    console.error("Failed to get most recent commit. Are you in a git repo?", err);
    Deno.exit(1);
});
fromDate.setDate(fromDate.getDate() + 1); // DST-safe day forward
let toDate = new Date();
let weekDays = [1, 2, 3, 4, 5];
let frequency = [1, 2, 3, 4];
let algo: "smart" | "random" | "cycle" = "smart";

function parseNumberRange(input: string): number[] {
    return input.split(',').flatMap(part =>
        part.includes('-')
            ? Array.from({ length: Number(part.split('-')[1]) - Number(part.split('-')[0]) + 1 }, (_, i) => Number(part.split('-')[0]) + i)
            : [Number(part)]
    );
}

function getFormattedDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function getRandomElement<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

function getClosestElement<T>(array: T[], linearIndex: number): T | undefined {
    if (array.length === 0) return undefined;
    linearIndex = Math.max(0, Math.min(1, linearIndex));
    const index = Math.round(linearIndex * (array.length - 1));
    return array[index];
}

function roundToDay(date: Date): Date {
    const roundedDate = new Date(date);
    roundedDate.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0
    return roundedDate;
}

for (let i = 0; i < Deno.args.length;) {
    const arg = Deno.args[i++];
    switch (arg.toLowerCase()) {
        case "--run":
        case "-r":
            break;
        case "--filename":
        case "-f":
            filename = Deno.args[i++] || "dummy.txt";
            break;
        case "--message":
        case "-m":
            message = Deno.args[i++] || "Hello";
            break;
        case "--fromdate":
        case "-fd":
            fromDate = new Date(Deno.args[i++]);
            if (isNaN(fromDate.getTime())) {
                console.error(`Error: Your '--fromDate' arg is problematic.`);
                Deno.exit(1);
            }
            break;
        case "--todate":
        case "-td":
            toDate = new Date(Deno.args[i++]);
            if (isNaN(toDate.getTime())) {
                console.error(`Error: Your '--toDate' arg is problematic.`);
                Deno.exit(1);
            }
            break;
        case "--weekdays":
        case "-w":
            weekDays = parseNumberRange(Deno.args[i++]);
            if (weekDays.length == 0) {
                console.error(`Warning: Your '--weekDays' seems a bit empty, don't you think? I'll just quit if you don't need any commits on any days whatsoever.`);
                Deno.exit(0);
            }
            break;
        case "--frequency":
        case "-fq":
            frequency = parseNumberRange(Deno.args[i++]);
            if (frequency.filter(i => i > 0).length == 0) {
                console.error(`Error: Your '--frequency ${frequency.join(",")}' seems a bit empty, don't you think?`);
                Deno.exit(1);
            }
            break;
        case "--algorithm":
        case "-a": {
            const algoUser = Deno.args[i++].toLowerCase();
            if (algoUser != "smart" && algoUser != "random" && algoUser != "cycle") {
                console.error("Error: Selected algorithm does not exist: '" + algoUser + "'\nTry: 'smart' | 'random' | 'cycle'")
                Deno.exit(1);
            }
            algo = algoUser;
            break;
        }
        default:
            console.log("Error: Huh? What do you mean by '" + arg + "'? The bug seems to be between the monitor and the chair. Bye.");
            Deno.exit(1);
    }
}

fromDate = roundToDay(fromDate);
toDate = roundToDay(toDate);
console.log(`Generating from ${getFormattedDate(fromDate)} to ${getFormattedDate(toDate)}:`);

function dateIndex(date: Date) {
    return date.getTime() / (1000 * 60 * 60 * 24);
}

function sigmoid(x: number) {
    return Math.pow(3, x) * (x * (x * 6 - 15) + 10);
}

let commitsDone = 0;
let index = 0;
console.log("Using " + algo + " algorithm.");
for (const date = new Date(fromDate); date <= toDate; date.setUTCDate(date.getUTCDate() + 1)) { // f*ck you, daylight saving time
    let commitCount = 1;
    if (algo == "random") {
        commitCount = getRandomElement(frequency) ?? 1;
    }
    if (algo == "smart") {
        const x = dateIndex(date);
        const sin = Math.sin; // so I could copy it to Desmos v
        const y = ((sin(x * 3) * 1 + sin(x * 5) * 5 + sin(x / 7) * 2 + sin(x / 11) * 2 + sin(x / 3.2316) * 7 + sin(x / 7.432) * 6 + sin(x / 3) * 13 + sin(x / 4) * 16) / 52 / 2 + 0.5) * (sin(x) + sin(x * 3.14) + 2) / 4;
        commitCount = getClosestElement(frequency.sort((a, b) => b - a), sigmoid(y)) ?? 1;
    }
    if (weekDays.includes(date.getDay())) {
        await generateCommits(commitCount, message, date, filename);
    }
    commitsDone += commitCount;
    index++;
}

console.log(`Generated ${commitsDone} commits to ${filename} file, counted ${index} days, now try 'git push -u origin master'! :3`);