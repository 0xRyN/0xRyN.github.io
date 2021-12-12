// These values will always be the same.
const LR_GUARD = "101";
const CENTER_GUARD = "01010";

/**
 * HOW IT WORKS :
 * RIGHT SIDE WILL ALWAYS HAVE CONSTANT VALUES FOR EACH NUMBER (C)
 * FOR LEFT SIDE, VALUES ARE DIFFERENT WHETHER THE NUMBER IS ODD (A) OR EVEN (B)
 * THE FIRST DIGIT DEFINES THE ORDER OF PARITY FOR THE NUMBERS
 * WE WILL DEFINE CONSTANTS FOR EACH
 */

// Order of parity
const EAN_13 = [
    "AAAAAA",
    "AABABB",
    "AABBAB",
    "AABBBA",
    "ABAABB",
    "ABBAAB",
    "ABBBAA",
    "ABABAB",
    "ABABBA",
    "ABBABA",
];

// Encoding tables
const ENCODING_TABLE = {
    /* Prototype : 
    Digit: [A, B, C]
    Example : We need to encode digit 3 in B parity.
    code = ENCODING_TABLE.three[1]
    */
    zero: ["0001101", "0100111", "1110010"],
    one: ["0011001", "0110011", "1100110"],
    two: ["0010011", "0011011", "1101100"],
    three: ["0111101", "0100001", "1000010"],
    four: ["0100011", "0011101", "1011100"],
    five: ["0110001", "0111001", "1001110"],
    six: ["0101111", "0000101", "1010000"],
    seven: ["0111011", "0010001", "1000100"],
    eight: ["0110111", "0001001", "1001000"],
    nine: ["0001011", "0010111", "1110100"],
};

class Barcode {
    constructor(msg, offX, offY, width) {
        // Let's add the check digit to the barcode
        const checkDig = this.getCheckDigit(msg);
        this.msg = msg += checkDig;

        // General offset for all rects
        this.offX = offX;
        this.offY = offY;

        // Bar width and height
        this.bWidth = width / 95.0;
        this.bHeight = Math.round(width * 0.5);

        // Array to be displayed
        this.rects = [];

        // Start computation : translate to binary
        this.computeBinaryCode();
    }

    getCheckDigit(msg) {
        // Hack to transform res (string) to an array of ints
        let res = msg.split("").map((v) => +v);
        let sum = 0;
        res.forEach((v, i) => {
            // Check if the index is even, if it is, multiply by 3 the digit
            i % 2 ? (sum += v * 3) : (sum += v);
        });
        // The last %10 is incade res % 10 = 0, 10 - 0 is 10 ans we need 0
        return (10 - (sum % 10)) % 10;
    }

    computeBinaryCode() {
        let binaryCode = "";

        // Find the pattern for the left side :
        let pattern = EAN_13[this.msg[0]];

        // Store the left side digits as an array of ints
        let leftSide = this.msg
            .substring(1, 7)
            .split("")
            .map((v) => +v);

        // Get the encoding table as indexes, will save us from writing "three" instead of 3
        let encTable = Object.values(ENCODING_TABLE);

        // Let's begin building the barcode !
        // First, add the left guard
        binaryCode += LR_GUARD;

        // Compute second to 6th digit (5 digits after the first)
        leftSide.forEach((v, i) => {
            // v is for the value of the digit, one, two, three etc...
            // i is the index of the array, if we are at index 2, get the pattern[2].
            // pattern[i] can be either A or B (left side), if it's A get first val
            // from enctable, else if it's B get the second value
            let patternIndex;
            pattern[i] === "A" ? (patternIndex = 0) : (patternIndex = 1);

            binaryCode += encTable[v][patternIndex];
        });

        // Left side over, let's add center guard !
        binaryCode += CENTER_GUARD;

        // Now, let's move to the right side
        let rightSide = this.msg
            .substring(7)
            .split("")
            .map((v) => +v);

        rightSide.forEach((v) => {
            // Now, the only index for the pattern is 2 : Right side is C only
            let patternIndex = 2;

            binaryCode += encTable[v][patternIndex];
        });

        // Let's add the ending guard

        binaryCode += LR_GUARD;

        // Once the binary code is generated, we can start building the barcode
        this.buildBarcode(binaryCode);
    }

    buildBarcode(binaryCode) {
        // Transform binary code into array of ints
        let code = binaryCode.split("").map((v) => +v);

        // For each binary number, add to the rect[] array the offset and the color
        code.forEach((v, i) => {
            this.rects.push({
                isBlack: v === 1 ? true : false,
                offset: i * this.bWidth,
            });
        });
    }

    // For each rect, display it using a rect() (processing)
    displayBarcode() {
        this.rects.forEach((rec) => {
            fill(255, 255, 255);
            noStroke();
            if (rec.isBlack) {
                fill(0, 0, 0);
            } else {
                noFill();
            }
            rect(this.offX + rec.offset, this.offY, this.bWidth, this.bHeight);
        });
    }
}

let b;
let inp;
let btn;
let cnv;
let error;

function btnClicked() {
    const regex = /[0-9]{12}/;
    let code = inp.value().match(regex);
    if (code != null) {
        error.removeClass("error-p");
        error.html(
            "C'est fait ! N'hésitez pas à scanner un produit français (avec par exemple Yuka) pour vérifier sa fonctionnalité."
        );
        b = new Barcode(code[0], 0, 0, width);
        loop();
    } else {
        error.addClass("error-p");
        error.html("Entrez 12 chiffres !!!!");
    }
}

function setup() {
    cnv = createCanvas(380, 200);
    background("#FFFFFF");
    noStroke();

    error = select("#error-code");

    inp = select("#barcode-input");

    btn = select("#barcode-btn");
    btn.mousePressed(btnClicked);

    btn.parent("container");
    cnv.parent("container");
}

function draw() {
    if (b != null) {
        background("#FFFFFF");
        b.displayBarcode();
        noLoop();
    }
}
