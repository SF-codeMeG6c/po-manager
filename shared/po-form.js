// Freeman Job Tools - shared PO form builder.
// Draws the Subcontractor Scope of Work page (no Acrobat form needed) and adds attachments as pages after it.
// Loaded by Trades-EST; needs pdf-lib on the page first. The logo is shared/freeman-logo.png in the repo.
//
//   POForm.build(values, attachments) -> the finished PDF as bytes
//     values:      jobCode, jobAddress, cityStateZip, lockBox, poNumber,
//                  superName, superEmail, superPhone,
//                  subName, contact, phone, email, subCode, category, amount, scope
//     attachments: [{ name, type, file }] not yet saved, or [{ name, type, url }] saved
//   POForm.amountText(v) -> "$12,345.00" from anything typed, or "" when there is no amount
//   POForm.scopeFit(scope) -> { left, right, per, fits }: lines used in each scope column (for the counter under a Scope box)
//
// The scope prints in two columns: one typed line per item, left column first, then the right one.
// A long item wraps inside its column and is never split between the columns. Blank lines count as lines,
// so pressing Return moves the next items down (or over to the right column). Too long for one page = an error.
(function () {
    var LOGO_URL = '/shared/freeman-logo.png';
    var FORM_CODE = 'SubSpec_Super_Forms_10-25-26_V3';
    var FOOTER = 'Freeman Restoration \u00b7 751 S. Weir Canyon Rd., Suite 157 PMB#153, Anaheim, CA 92808 \u00b7 800-778-8910 \u00b7 www.freemanrestoration.com \u00b7 CSLB#688391';
    var AGREEMENT = 'Freeman Restoration, in exchange for goods and services provided by the Subcontractor, agrees to pay the Subcontract amount upon completion of the Subcontractor\u2019s work per the terms and conditions of payment as outlined in the Master Agreement. Any changes or extras not signed for by the Supervisor will not be paid.';

    // Scope box size: two columns of SCOPE_PER lines each (the counter and the PDF use the same numbers)
    var SCOPE_W = 532, SCOPE_H = 268, SCOPE_PAD = 10, SCOPE_GAP = 16, SCOPE_LINE_H = 12.5, SCOPE_SIZE = 9;
    var SCOPE_COL_W = (SCOPE_W - 2 * SCOPE_PAD - SCOPE_GAP) / 2;
    var SCOPE_PER = Math.floor((SCOPE_H - 30) / SCOPE_LINE_H);

    // The built-in fonts only know common characters: anything else (an emoji, an arrow) prints as "?"
    function safe(s, font) {
        var out = '';
        String(s == null ? '' : s).replace(/\t/g, '    ').replace(/\r/g, '').split('').forEach(function (ch) {
            try { font.encodeText(ch); out += ch; } catch (e) { out += '?'; }
        });
        return out;
    }
    function wrap(s, font, size, maxW, indent) {
        var out = [], cur = '';
        safe(s, font).split(' ').forEach(function (word) {
            var tryS = cur ? cur + ' ' + word : word;
            if (cur && font.widthOfTextAtSize(tryS, size) > maxW) { out.push(cur); cur = indent + word; }
            else cur = tryS;
        });
        out.push(cur);
        return out;
    }
    // Where each scope line goes: one typed line per item, left column first, then the right one.
    // A long item wraps inside its column and is never split between columns; a blank line takes one line.
    function layoutScope(scope, font) {
        var placed = [], col = 0, row = 0, left = 0, right = 0, fits = true;
        var items = String(scope == null ? '' : scope).replace(/\r/g, '').replace(/\s+$/, '').split('\n');
        if (items.length === 1 && items[0] === '') items = [];
        items.forEach(function (item) {
            var wrapped = item.trim() === '' ? [''] : wrap(item, font, SCOPE_SIZE, SCOPE_COL_W, /^\s*-\s/.test(item) ? '   ' : '');
            if (!fits) { right += wrapped.length; return; }
            if (row + wrapped.length > SCOPE_PER && col === 0) { col = 1; row = 0; }
            if (row + wrapped.length > SCOPE_PER) { fits = false; right += wrapped.length; return; }
            wrapped.forEach(function (t) { placed.push({ text: t, col: col, row: row }); row++; });
            if (col === 0) left = row; else right = row;
        });
        return { placed: placed, left: left, right: right, per: SCOPE_PER, fits: fits };
    }
    // For the counter: measured with the same font, so it always agrees with the PDF
    var measureFont = null;
    async function scopeFit(scope) {
        if (!window.PDFLib) throw new Error('The PDF library did not load.');
        if (!measureFont) measureFont = window.PDFLib.PDFDocument.create().then(function (d) { return d.embedFont(window.PDFLib.StandardFonts.Helvetica); });
        var r = layoutScope(scope, await measureFont);
        return { left: r.left, right: r.right, per: r.per, fits: r.fits };
    }

    // Amount always shown as $12,345.00 (typed with or without $ or commas). Blank stays blank.
    function amountText(v) {
        var raw = String(v == null ? '' : v).replace(/[^0-9.]/g, '');
        var num = parseFloat(raw);
        if (!raw || isNaN(num)) return '';
        return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    async function build(v, attachments) {
        if (!window.PDFLib) throw new Error('The PDF library did not load.');
        var PDFDocument = window.PDFLib.PDFDocument, StandardFonts = window.PDFLib.StandardFonts, rgb = window.PDFLib.rgb;

        var pdfDoc = await PDFDocument.create();
        var page = pdfDoc.addPage([612, 792]); // letter size
        var R = await pdfDoc.embedFont(StandardFonts.Helvetica);
        var B = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        var logoRes = await fetch(LOGO_URL);
        if (!logoRes.ok) throw new Error('Could not load the logo (' + logoRes.status + '). Check that shared/freeman-logo.png is in the repo.');
        var logo = await pdfDoc.embedPng(await logoRes.arrayBuffer());

        var gold = rgb(0.97, 0.69, 0.10), ink = rgb(0.13, 0.13, 0.13), grey = rgb(0.45, 0.45, 0.45);
        var line = rgb(0.8, 0.8, 0.8), red = rgb(0.75, 0.1, 0.1), pale = rgb(0.97, 0.97, 0.97), white = rgb(1, 1, 1);
        var L = 40, W = 532;

        function text(s, x, y, o) {
            o = o || {};
            var font = o.bold ? B : R, size = o.size || 9;
            var str = safe(s, font);
            // A value that is too wide for its space is made a little smaller, then cut with "..." so it never runs into the next box
            if (o.maxW) {
                while (size > 7.5 && font.widthOfTextAtSize(str, size) > o.maxW) size -= 0.25;
                if (font.widthOfTextAtSize(str, size) > o.maxW) {
                    while (str.length > 1 && font.widthOfTextAtSize(str + '...', size) > o.maxW) str = str.slice(0, -1);
                    str = str.replace(/\s+$/, '') + '...';
                }
            }
            page.drawText(str, { x: x, y: y, size: size, font: font, color: o.color || ink });
        }
        // A titled box of label / value rows, in one or two columns side by side
        function panel(x, w, title, rows, top, cols) {
            cols = cols || 1;
            var per = Math.ceil(rows.length / cols), h = 16 + per * 17 + 6, cw = w / cols;
            page.drawRectangle({ x: x, y: top - 16, width: w, height: 16, color: pale });
            page.drawRectangle({ x: x, y: top - h, width: w, height: h, borderColor: line, borderWidth: 0.8 });
            text(title, x + 8, top - 11.5, { bold: true, size: 8, color: grey });
            rows.forEach(function (r, i) {
                var c = Math.floor(i / per), yy = top - 30 - (i % per) * 17, xx = x + c * cw;
                text(r[0], xx + 8, yy, { size: 8, color: grey });
                text(r[1], xx + 78, yy, { size: 9.5, maxW: cw - 86 });
            });
            return h;
        }

        // Logo, centered
        var lw = 300, lh = lw * logo.height / logo.width;
        page.drawImage(logo, { x: (612 - lw) / 2, y: 792 - 28 - lh, width: lw, height: lh });
        var y = 792 - 28 - lh - 14;

        // Title bar with the PO number
        page.drawRectangle({ x: L, y: y - 22, width: W, height: 22, color: ink });
        text('SUBCONTRACTOR SCOPE OF WORK', L + 10, y - 15, { bold: true, size: 12, color: white });
        var poText = safe('PO# ' + (v.poNumber || ''), B), poSize = 12;
        while (poSize > 8 && B.widthOfTextAtSize(poText, poSize) > 250) poSize -= 0.5;
        page.drawText(poText, { x: L + W - 10 - B.widthOfTextAtSize(poText, poSize), y: y - 15, size: poSize, font: B, color: gold });
        y -= 34;

        // Job and Supervisor, then Subcontractor
        var half = (W - 12) / 2;
        var h1 = panel(L, half, 'JOB', [['Job code', v.jobCode], ['Address', v.jobAddress], ['City/State/Zip', v.cityStateZip], ['Lock box', v.lockBox]], y);
        panel(L + half + 12, half, 'SUPERVISOR', [['Super', v.superName], ['Phone', v.superPhone], ['Email', v.superEmail], ['', '']], y);
        y -= h1 + 10;
        var h2 = panel(L, W, 'SUBCONTRACTOR', [['Company', v.subName], ['Contact', v.contact], ['Phone', v.phone],
            ['Email', v.email], ['Sub code', v.subCode], ['Category', v.category]], y, 2);
        y -= h2 + 10;

        // Scope of work, two columns (see layoutScope)
        var sh = SCOPE_H, colW = SCOPE_COL_W;
        page.drawRectangle({ x: L, y: y - 16, width: W, height: 16, color: pale });
        page.drawRectangle({ x: L, y: y - sh, width: W, height: sh, borderColor: line, borderWidth: 0.8 });
        text('SCOPE OF WORK', L + 8, y - 11.5, { bold: true, size: 8, color: grey });
        var midX = L + SCOPE_PAD + colW + SCOPE_GAP / 2;
        page.drawLine({ start: { x: midX, y: y - 22 }, end: { x: midX, y: y - sh + 6 }, thickness: 0.6, color: line });
        var lay = layoutScope(v.scope, R);
        if (!lay.fits) throw new Error('The scope is too long for one page. Shorten it, or remove some blank lines.');
        lay.placed.forEach(function (p) {
            if (p.text) page.drawText(p.text, { x: L + SCOPE_PAD + p.col * (colW + SCOPE_GAP), y: y - 30 - p.row * SCOPE_LINE_H, size: SCOPE_SIZE, font: R, color: ink });
        });
        y -= sh + 10;

        // Payment notice
        page.drawRectangle({ x: L, y: y - 34, width: W, height: 34, borderColor: red, borderWidth: 1 });
        text('THIS SCOPE OF WORK MUST ACCOMPANY YOUR REQUEST FOR PAYMENT.', L + 10, y - 14, { bold: true, size: 9, color: red });
        text('Do not mail or fax invoices. Email only to freemanrestorationbilling@gmail.com', L + 10, y - 27, { size: 9, color: red });
        y -= 46;

        // Master Agreement paragraph
        wrap(AGREEMENT, R, 7.8, W, '').forEach(function (s, i) { page.drawText(s, { x: L, y: y - i * 11, size: 7.8, font: R, color: grey }); });
        y -= 46;

        // Amounts: Contract Amount filled in, the other two left blank to fill by hand
        var cw3 = (W - 24) / 3, amt = amountText(v.amount);
        [['CONTRACT AMOUNT', amt], ['PREVIOUS PAYMENT', ''], ['AMOUNT NOW DUE', '']].forEach(function (a, i) {
            var x = L + i * (cw3 + 12);
            page.drawRectangle({ x: x, y: y - 40, width: cw3, height: 40, borderColor: i === 0 ? gold : line, borderWidth: i === 0 ? 1.5 : 0.8 });
            text(a[0], x + 8, y - 13, { bold: true, size: 7.5, color: grey });
            if (a[1]) text(a[1], x + 8, y - 32, { bold: true, size: 14, maxW: cw3 - 16 });
            else page.drawLine({ start: { x: x + 8, y: y - 32 }, end: { x: x + cw3 - 8, y: y - 32 }, thickness: 0.6, color: line });
        });
        y -= 52;
        var submit = 'SUBMIT THIS AS OR WITH YOUR INVOICE FOR PAYMENT';
        text(submit, (612 - B.widthOfTextAtSize(submit, 9)) / 2, y, { bold: true, size: 9 });

        // Footer
        page.drawLine({ start: { x: L, y: 40 }, end: { x: L + W, y: 40 }, thickness: 0.6, color: line });
        text(FOOTER, (612 - R.widthOfTextAtSize(safe(FOOTER, R), 6.8)) / 2, 28, { size: 6.8, color: grey });
        text(FORM_CODE, L, 16, { size: 6.5, color: grey });

        // Attachment pages after the form, in list order
        var list = attachments || [];
        for (var i = 0; i < list.length; i++) {
            var att = list[i];
            var bytes;
            if (att.file) bytes = await att.file.arrayBuffer();
            else {
                var got = await fetch(att.url);
                if (!got.ok) throw new Error('Could not load the attachment ' + att.name + ' (' + got.status + ').');
                bytes = await got.arrayBuffer();
            }
            if (att.type === 'application/pdf') {
                var src = await PDFDocument.load(bytes, { ignoreEncryption: true });
                try { src.getForm().flatten(); } catch (e) { /* no form fields */ }
                var pages = await pdfDoc.copyPages(src, src.getPageIndices());
                pages.forEach(function (p) { pdfDoc.addPage(p); });
            } else {
                var img = att.type === 'image/png' ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
                var pg = pdfDoc.addPage([612, 792]); // letter size
                var scale = Math.min(540 / img.width, 720 / img.height, 1);
                var w = img.width * scale, h = img.height * scale;
                pg.drawImage(img, { x: (612 - w) / 2, y: (792 - h) / 2, width: w, height: h });
            }
        }

        return await pdfDoc.save();
    }

    window.POForm = { build: build, amountText: amountText, scopeFit: scopeFit };
})();
