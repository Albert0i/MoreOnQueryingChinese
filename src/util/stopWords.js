/**
 * Removes predefined stop words from a given text string.
 *
 * This function uses a regular expression built from the global `wordsToRemove` array
 * to strip out matching stop words from the input text. It is typically used in
 * natural language processing or text normalization tasks to clean and simplify input.
 *
 * @param {string} text - The input string from which stop words should be removed.
 * @returns {string} The cleaned string with stop words removed.
 */
export function removeStopWord(text) {
    // Create regex pattern
    const pattern = new RegExp(wordsToRemove.join('|'), 'g'); 
    
    return text.replace(pattern, '');
}

const wordsToRemove = [
    "的",    //
    "了",    //
    "　",    //
    "”",     //
    "“",     //
    "’",     // 
    "‘",     // 
    "。",    // 句號 (Full Stop)
    "，",    // 逗號 (Comma)
    "、",    // 頓號 (Enumeration Comma)
    "？",    // 問號 (Question Mark)
    "！",    // 歎號 (Exclamation Mark)
    "；",    // 分號 (Semicolon)
    "：",    // 冒號 (Colon)
    "「",    // 引號 (Quotation Marks, double)
    "」",    // 引號 (Quotation Marks, double)
    "『",    // 引號 (Quotation Marks, single)
    "』",    // 引號 (Quotation Marks, single)
    "（",    // 括號 (Parentheses)
    "）",    // 括號 (Parentheses)
    "—",     // 破折號 (Dash)
    "《",    // 書名號 (Title Marks)
    "》",    // 書名號 (Title Marks)
    "·",     // 間隔號 (Interpunct)
    "…",      // 省略號 (Ellipsis)
    "<br />"
]

/*
export function spaceChineseChars(text) {
    return text.replace(/([\u4e00-\u9fff])/g, '$1 ');
}
*/
/**
 * Inserts spaces between Chinese characters and English alphanumeric tokens.
 *
 * This function separates each Chinese character and keeps English words or
 * numeric sequences grouped, inserting spaces between all matched tokens.
 * Useful for preprocessing multilingual text before natural language processing
 * or display formatting.
 *
 * @param {string} text - The input string containing Chinese and English characters.
 * @returns {string} The formatted string with spaces between characters and word groups.
 */
export function spaceChineseChars(text) {
    // Match Chinese characters individually, and English words as a whole
    const pattern = /[\u4e00-\u9fff]|[a-zA-Z0-9]+/g;
    const tokens = text.match(pattern);
    return tokens ? tokens.join(' ') : '';
}

/**
 * Checks whether the given token represents a valid numeric string.
 *
 * A token is considered numeric if it is a non-empty string and can be
 * successfully converted to a number without resulting in NaN.
 *
 * @param {string} token - The input string to be evaluated.
 * @returns {boolean} Returns true if the token is a valid numeric string, false otherwise.
 */

export function isNumeric (token) { 
    return typeof token === 'string' && 
                  token.trim() !== '' && !isNaN(Number(token));
}

/**
 * isEnglishOrSymbol
 * ------------------
 * Tests whether the input string contains at least one English alphabet character (A–Z, a–z)
 * or common symbol characters such as punctuation and special keys.
 *
 * Symbols matched include:
 * ! @ # $ % ^ & * ( ) _ + - = [ ] { } ; ' : " \ | , . < > / ?
 *
 * @param {string} token - The string to be tested.
 * @returns {boolean} - Returns true if the string contains English letters or symbols; false otherwise.
 *
 * Example:
 *   isEnglishOrSymbol("hello!") ➞ true
 *   isEnglishOrSymbol("測試")     ➞ false
 */
export function isEnglishOrSymbol (token) {
    return /[A-Za-z!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(token);
} 

/**
 * trimEdgeQuotes
 * --------------
 * Removes a pair of double quotes from the start and end of a string.
 * Internal quotes (e.g., within the string body) remain untouched.
 *
 * Example:
 *   Input : '"The "quoted" word."'
 *   Output: 'The "quoted" word.'
 *
 * @param {string} str - The input string to sanitize.
 * @returns {string} - The string without surrounding quotes.
 */
export function trimEdgeQuotes (str) {
    return str.replace(/^"(.*)"$/, '$1');
};

