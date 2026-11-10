export function csvValue(value:unknown){const text=String(value??'');const safe=/^(?:\s*[=+\-@]|[\t\r])/.test(text)?"'"+text:text;return '"'+safe.replaceAll('"','""')+'"'}
export function serializeCsv(rows:unknown[][]){return '\ufeff'+rows.map(row=>row.map(csvValue).join(',')).join('\r\n')}
