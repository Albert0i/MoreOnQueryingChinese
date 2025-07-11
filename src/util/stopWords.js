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
    "…"      // 省略號 (Ellipsis)
]

/*
export function spaceChineseChars(text) {
    return text.replace(/([\u4e00-\u9fff])/g, '$1 ');
}
*/
export function spaceChineseChars(text) {
    // Match Chinese characters individually, and English words as a whole
    const pattern = /[\u4e00-\u9fff]|[a-zA-Z0-9]+/g;
    const tokens = text.match(pattern);
    return tokens ? tokens.join(' ') : '';
}
 