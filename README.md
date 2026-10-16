# Sankofa & Sage

Ghanaian and international restaurant website with a searchable menu, prices in Ghana cedis, a shopping cart, delivery and pickup choices, and WhatsApp order requests to **0554510756**.

This is a complete static HTML, CSS and JavaScript project. Food images and fonts are included locally, and no package installation is required.

## Run in VS Code

1. Extract the ZIP, then open the **sankofa-and-sage** folder in Visual Studio Code. Open the folder containing `package.json` and `index.html`.
2. Install [Node.js](https://nodejs.org/) version 18 or newer if it is not already installed. A current LTS release is recommended.
3. Choose **Terminal → New Terminal** and run:

   ```sh
   npm start
   ```

4. Open **http://localhost:5173** in your browser. Keep the terminal open while using the website; press **Ctrl+C** to stop the server.

`npm run dev` does the same thing. After saving a code change, refresh the browser. The supplied server is for local development and listens only on your computer.

Alternatively, install the recommended **Live Server** extension in VS Code, right-click `index.html`, and choose **Open with Live Server**. Opening `index.html` directly as a file will not load the JavaScript modules correctly.

The included VS Code tasks are available from **Terminal → Run Task**: **Website: start**, **Website: check**, and **Website: build**.

## Publish on GitHub Pages

1. Create a new **public GitHub repository**, using `main` as its default branch.
2. Upload the contents of the extracted **sankofa-and-sage** folder to the repository root. `index.html`, `package.json`, `scripts/`, `images/`, and `fonts/` must be at the top level, not inside another folder.
3. Include the hidden **.github** folder, especially `.github/workflows/pages.yml`. If the browser upload omits it, use **Add file → Create new file**, enter `.github/workflows/pages.yml`, and paste in the supplied workflow.
4. In the repository, open **Settings → Pages**, then set **Source** to **GitHub Actions**.
5. Open **Actions → Deploy restaurant website to GitHub Pages → Run workflow**, select `main`, and run it. Future pushes to `main` deploy automatically.
6. When the deployment succeeds, use the website link shown in **Settings → Pages** or in the deployment job.

A project website usually has this address:

```text
https://USERNAME.github.io/REPOSITORY/
```

Replace `USERNAME` and `REPOSITORY` with your actual GitHub username and repository name. The website uses relative asset paths so it works under that repository path. Visitors do not need a GitHub or ChatGPT login.

If you use a branch name other than `main`, update both `main` references in `.github/workflows/pages.yml`. GitHub Pages must be enabled before the workflow can deploy.

## Edit your restaurant

Use **menu-data.js** as the source for menu items and ordering settings:

- `menu`: change dish names, descriptions, prices, categories, allergens, and image filenames. Prices are numbers in Ghana cedis, for example `price: 95`.
- `menuCategories`: change the filter categories. Each dish's `category` must match a category name.
- `business`: restaurant name, city, branches, phone numbers, and `freeDeliveryThreshold` (currently GH₵250).
- `deliveryZones`: Accra delivery areas and their fees. Confirm the other branches' service areas and fees before offering delivery there.

Phone formats serve different purposes: `phone` is `0554510756`, `internationalPhone` is `+233554510756`, and `whatsappNumber` is `233554510756` without a plus sign or spaces.

The other branches currently use a sample GH₵20 city-centre delivery fee in `zonesForBranch()` in **app.js**. Edit that function to set the other branches' actual service areas and fees.

Change page wording and sections in **index.html**, including the displayed restaurant name, branch cards, phone links, WhatsApp links, and free-delivery offer when those business details change. Change design and mobile styles in **styles.css**, and ordering interactions in **app.js**. Add replacement food photos to **images/** and use relative paths such as `images/jollof.jpg` in the menu. Keep dish IDs unique.

The supplied menu prices, delivery fees, allergy details, offers, and branch locations are samples for the restaurant concept. Replace them with confirmed business information before taking live orders.

## How orders work

Customers add dishes, choose delivery or pickup, and enter their contact details. Checkout opens WhatsApp with the order and calculated total. **The customer must tap Send in WhatsApp**, and the restaurant confirms availability, final pricing, payment instructions, and delivery or pickup time.

The site does not process payments, send orders automatically, or include an order database or rider dispatch service. Those services can be added separately. The cart is stored in the customer's browser; contact and delivery details are included in the WhatsApp message when the customer sends it.

## Check and build

```sh
npm run check
npm run build
```

The build creates **dist/** with the website files ready for static hosting. The supplied GitHub Actions workflow builds this folder and publishes it to GitHub Pages. Do not edit `dist/`; edit the source files and build again.

## Credits and original prompt

Keep **photo-credits.html** and the font licence files in **fonts/** with the website. They describe the included photography and typeface licences. If you replace photos, update the credits with the new sources and licence terms.

**WEBSITE_PROMPT.md** contains the original website brief for future design changes.

Banku, fufu, waakye and red-red imagery is realistic styled serving illustration generated for this restaurant concept. The other food images are licensed stock photography. These visuals are serving inspiration, not photographs of the restaurant’s own food.
