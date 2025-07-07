const wordsToRemove = ["的", "了"]

export function removeWords(text) {
    const pattern = new RegExp(wordsToRemove.join('|'), 'g'); // Create regex pattern
    return text.replace(pattern, '');
}

// const wordsToRemove = ["的",    //
//     "了",    //
//     "。",    // 句號 (Full Stop)
//     "，",    // 逗號 (Comma)
//     "、",    // 頓號 (Enumeration Comma)
//     "？",    // 問號 (Question Mark)
//     "！",    // 歎號 (Exclamation Mark)
//     "；",    // 分號 (Semicolon)
//     "：",    // 冒號 (Colon)
//     "「",    // 引號 (Quotation Marks, double)
//     "」",    // 引號 (Quotation Marks, double)
//     "『",    // 引號 (Quotation Marks, single)
//     "』",    // 引號 (Quotation Marks, single)
//     "（",    // 括號 (Parentheses)
//     "）",    // 括號 (Parentheses)
//     "—",     // 破折號 (Dash)
//     "《",    // 書名號 (Title Marks)
//     "》",    // 書名號 (Title Marks)
//     "·",     // 間隔號 (Interpunct)
//     "…"      // 省略號 (Ellipsis)
// ]
