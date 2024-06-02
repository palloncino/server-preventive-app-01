import puppeteer from "puppeteer";
import { marked } from "marked";
import path from "path";
import imageToBase64 from "image-to-base64";
import { section_b_html_str } from "./sectionB.js"; // Import section B

export async function generatePDF(quote) {
  const browser = await puppeteer.launch({
    executablePath: process.env.BROWSER_EXECUTABLE,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    timeout: 30000,
  });

  // Convert image to base64
  let base64Image;
  try {
    base64Image = await imageToBase64(
      path.resolve(process.env.IMAGES_FOLDER_PATH, "logo.png")
    );
  } catch (error) {
    console.error("Error converting image to base64:", error);
    return;
  }

  // Function to convert Markdown to HTML
  const convertMarkdownToHtml = (markdown) => marked(markdown);

  // Parse and convert Markdown content
  const productsHtml = quote.data.addedProducts
    .map((product, index) => {
      const productDescriptionHtml = convertMarkdownToHtml(product.description);
      const componentsHtml = product.components
        .map((component) => {
          const componentDescriptionHtml = convertMarkdownToHtml(
            component.description
          );
          return `
            <div class="product-component">
              <div class="component-row">
                <span class="component-name">${component.name}</span>
                <span class="component-price">$${parseFloat(
                  component.price
                ).toFixed(2)}</span>
              </div>
              <div class="component-description">${componentDescriptionHtml}</div>
              <div class="component-documentation">
                <ul>
                  ${component.documentation
                    .map(
                      (doc) => `<li><a href="${doc.url}">${doc.name}</a></li>`
                    )
                    .join("")}
                </ul>
              </div>
            </div>
          `;
        })
        .join("");

      return `
        <div class="product">
          <div class="product-details">
            <div class="product-row">
              <span class="product-name">${product.name}</span>
              <span class="product-price">$${parseFloat(product.price).toFixed(
                2
              )}</span>
            </div>
            <div class="product-row">
              <span class="product-id">ID: ${product.id}</span>
              <span class="product-category">Category: ${
                product.category
              }</span>
            </div>
            <div class="product-description">${productDescriptionHtml}</div>
            <div class="product-documentation">
              <ul>
                ${product.documentation
                  .map((doc) => `<li><a href="${doc.url}">${doc.name}</a></li>`)
                  .join("")}
              </ul>
            </div>
          </div>
          <div class="product-image">
            <img src="${product.imgUrl}" alt="${product.name}" />
          </div>
        </div>
        <div class="product-components">
          <div class="components-heading">Product's Components</div>
          ${componentsHtml}
        </div>
      `;
    })
    .join("");

  // HTML template for the PDF
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Quote ${quote.quoteNumber} - ${quote.company}</title>
      <link href="https://fonts.googleapis.com/css?family=Roboto:400,700&display=swap" rel="stylesheet" />
      <script>
        const font = new FontFaceObserver('Roboto');
        font.load().then(() => {
          document.fonts.add(font);
        }).catch((err) => {
          console.error('Roboto font failed to load:', err);
        });
      </script>
      <style>
        body {
          margin: 0;
          font-family: "Roboto", sans-serif;
          line-height: 2rem;
        }
        .header-container {
          margin-bottom: 2rem;
          box-sizing: border-box;
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          height: 100px;
          gap: 1rem;
        }
        .header-logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        .header-logo-container img.logo {
          max-height: 54px;
          height: 100%;
        }
        .header-title-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
        }
        .header-title-container .header-title {
          font-size: 1.4rem;
        }
        .header-title-container .header-subtitle {
          font-size: 1rem;
        }

        .section {
          padding-bottom: 4rem;
          margin-bottom: 2rem;
          padding: 1rem;
        }

        .section:last-child {
          margin-bottom: 0;
        }

        .section-title-header {
          height: 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          font-size: 1.4rem;
        }

        .section.heading {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          padding-right: 4rem;
          gap: 6rem;
        }

        .flex {
          display: flex;
          width: 100%;
        }
        .empty {
          flex: 1;
        }

        .intro-details-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          gap: 1rem;
        }

        .intro-detail {
          display: block;
        }

        .intro-detail.object {
          font-size: 1.4rem;
          font-weight: 700;
        }
        .intro-detail.description {
        }

        .client-details-container {
          text-align: right;
          flex: 1;
        }
        .client-detail {
          display: block;
        }
        .client-detail.company {
          font-weight: 700;
          display: block;
        }

        .section.products {
          box-sizing: border-box;
          padding-right: 0;
          display: grid;
          gap: 2rem;
        }

        .product {
          box-sizing: border-box;
          display: grid;
          grid-template-columns: 3fr 1fr;
          gap: 1rem;
        }

        .product-image img {
          box-sizing: border-box;
          border-left: 1px solid #ddd;
          padding: 1rem;
          width: 100%;
          height: auto;
        }

        .product-details {
          display: grid;
          gap: 1rem;
        }

        .product-row {
          display: flex;
          justify-content: space-between;
        }

        .product-name {
          font-weight: bold;
          font-size: 1.2rem;
        }

        .product-price {
          font-weight: bold;
          font-size: 1.2rem;
        }

        .product-id,
        .product-category {
          font-size: 0.9rem;
          color: #666;
        }

        .product-description,
        .product-documentation {
          width: 100%;
        }

        .product-documentation ul {
          list-style-type: none;
          padding: 0;
        }

        .product-documentation ul li {
          display: inline;
          margin-right: 1rem;
        }

        .product-components {
          padding: 0 1rem 1rem 0;
          margin-left: 4rem;
        }

        .components-heading {
          font-weight: bold;
          margin-bottom: 1rem;
        }

        .product-component {
          border-top: 1px solid #ddd;
          padding-top: 1rem;
          margin-top: 1rem;
        }

        .component-row {
          display: flex;
          justify-content: space-between;
        }

        .component-name {
          font-weight: bold;
          font-size: 1.1rem;
        }

        .component-price {
          font-weight: bold;
          font-size: 1.1rem;
        }

        .component-id,
        .component-category {
          font-size: 0.9rem;
          color: #666;
        }

        .component-description,
        .component-documentation {
          width: 100%;
        }

        .component-documentation ul {
          list-style-type: none;
          padding: 0;
        }

        .component-documentation ul li {
          display: inline;
          margin-right: 1rem;
        }

        .section.total {
          border: 1px solid #ddd;
          padding: 1rem;
          margin: 1rem 0;
        }

        .section.total h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }

        .section.total p {
          font-size: 1rem;
          margin: 0.5rem 0;
        }

        .section.total p strong {
          font-weight: bold;
        }

        .section.legal {
        }

        .section.signature {
        }

        .signature-line {
        }

        .section.footer {
        }
      </style>
    </head>
    <body>
      <div class="header-container">
        <div class="header-logo-container">
          <img
            class="logo"
            src="data:image/png;base64,${base64Image}"
            alt="Company Logo"
          />
        </div>
        <div class="header-title-container">
          <span class="header-title">${quote.company}</span>
          <span class="header-subtitle">Product & Services</span>
        </div>
      </div>

      <div class="section heading">
        <div class="flex">
          <div class="empty"></div>
          <div class="client-details-container">
            <span class="client-detail company">${
              quote.data.selectedClient.companyName
            }</span>
            <span class="client-detail">${
              quote.data.selectedClient.address.street
            }, ${quote.data.selectedClient.address.city}, ${
    quote.data.selectedClient.address.country
  }</span>
            <span class="client-detail">${
              quote.data.selectedClient.mobileNumber
            }</span>
            <span class="client-detail">${
              quote.data.selectedClient.email
            }</span>
          </div>
        </div>
        <div class="flex">
          <div class="intro-details-container">
            <span class="intro-detail object">${
              quote.data.quoteHeadDetails.object
            }</span>
            <span class="intro-detail description">${
              quote.data.quoteHeadDetails.description
            }</span>
          </div>
        </div>
      </div>

      <div class="section-title-header">1. PRODUCTS SECTION</div>
      <div class="section products">${productsHtml}</div>

      <div class="section-title-header">2. EXPENSES SECTION</div>
      <div class="section total">
        <p><strong>Subtotal:</strong> $${parseFloat(quote.subtotal).toFixed(
          2
        )}</p>
        <p><strong>Tax Rate:</strong> ${quote.taxRate * 100}%</p>
        <p><strong>Total:</strong> $${parseFloat(quote.total).toFixed(2)}</p>
      </div>

      <div class="section-title-header">3. LEGAL SECTION</div>
      ${section_b_html_str} <!-- Include section B -->

      <div class="section signature">
        <div>
          <p>Date: ${quote.date}</p>
          <div class="signature-line"></div>
        </div>
        <div>
          <p>Signature:</p>
          <div class="signature-line">
            <img src="${quote.signature}" alt="Signature" />
          </div>
        </div>
      </div>

      <div class="section footer">
        <p>This quote is valid until ${quote.expiryDate.toDateString()}</p>
      </div>
    </body>
  </html>
  `;

  const page = await browser.newPage();
  await page.setContent(htmlContent, {
    waitUntil: "domcontentloaded",
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "40px",
      bottom: "40px",
      right: "40px",
      left: "40px",
    },
  });

  await browser.close();
  return pdfBuffer;
}
