// Freeman Job Tools - shared PO form builder.
// Fills the Subcontractor Scope of Work form (the same blank PDF PO Manager uses) and adds
// attachments as pages after it. Loaded by Trades-EST; needs pdf-lib on the page first.
//
//   POForm.build(values, attachments) -> the finished PDF as bytes
//     values:      jobCode, jobAddress, cityStateZip, lockBox, poNumber,
//                  superName, superEmail, superPhone,
//                  subName, contact, phone, email, subCode, category, amount, scope
//     attachments: [{ name, type, file }] not yet saved, or [{ name, type, url }] saved
//   POForm.amountText(v) -> "$12,345.00" from anything typed, or "" when there is no amount
(function () {
    var TEMPLATE_URL = 'https://raw.githubusercontent.com/SF-codeMeG6c/po-manager/main/Sub_Spec_Blank_9-20-26_V2.pdf';

    // Amount always shown as $12,345.00 (typed with or without $ or commas). Blank stays blank.
    function amountText(v) {
        var raw = String(v == null ? '' : v).replace(/[^0-9.]/g, '');
        var num = parseFloat(raw);
        if (!raw || isNaN(num)) return '';
        return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    async function build(v, attachments) {
        if (!window.PDFLib) throw new Error('The PDF library did not load.');
        var PDFDocument = window.PDFLib.PDFDocument;

        var response = await fetch(TEMPLATE_URL);
        if (!response.ok) throw new Error('Could not load the blank form (' + response.status + ').');
        var pdfDoc = await PDFDocument.load(await response.arrayBuffer());
        var form = pdfDoc.getForm();

        // PDF form field name -> value
        var values = {
            'Job Code': v.jobCode,
            'Job Address': v.jobAddress,
            'City State Zip': v.cityStateZip,
            'Lock Box': v.lockBox,
            'PO': v.poNumber,
            'Super': v.superName,
            'Email': v.superEmail,
            'Super Phone': v.superPhone,
            'Subcontractor': v.subName,
            'Contact': v.contact,
            'Phone': v.phone,
            'Email_2': v.email,
            'Sub Code': v.subCode,
            'Category': v.category,
            'Contract Amount': amountText(v.amount),
            'Text1': v.scope
        };
        // Match on name with extra spaces ignored (the form has "City  State  Zip")
        form.getFields().forEach(function (field) {
            var name = field.getName().replace(/\s+/g, ' ').trim();
            if (values[name] !== undefined && field.setText) field.setText(values[name] || '');
        });

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
                var page = pdfDoc.addPage([612, 792]); // letter size
                var scale = Math.min(540 / img.width, 720 / img.height, 1);
                var w = img.width * scale, h = img.height * scale;
                page.drawImage(img, { x: (612 - w) / 2, y: (792 - h) / 2, width: w, height: h });
            }
        }

        return await pdfDoc.save();
    }

    window.POForm = { build: build, amountText: amountText };
})();
