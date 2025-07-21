/*
 * scripts.js
 *
 * This file contains the logic for the grooming estimator page. It
 * dynamically loads the list of breeds and add‑ons from JSON files,
 * updates pricing as the user makes selections and allows them to
 * generate a simple inquiry summarising their request. If you extend
 * this functionality (e.g. by integrating with a form submission or
 * calendar), place your custom code here.
 */

document.addEventListener('DOMContentLoaded', () => {
  // If the breed select exists on the page, initialise the estimator.
  const breedSelect = document.getElementById('breedSelect');
  if (breedSelect) {
    initEstimator();
  }
});

async function initEstimator() {
  const breedSelect = document.getElementById('breedSelect');
  const serviceSelect = document.getElementById('serviceSelect');
  const addonsContainer = document.getElementById('addonsContainer');
  const totalDisplay = document.getElementById('totalDisplay');
  const submitBtn = document.getElementById('submitInquiry');

  // Load data
  const breeds = await fetch('data/breeds.json').then(res => res.json());
  const addons = await fetch('data/addons.json').then(res => res.json());

  // Populate breed select
  breeds.forEach(item => {
    const option = document.createElement('option');
    option.value = item.breed;
    option.textContent = item.breed;
    breedSelect.appendChild(option);
  });

  // State for selected items
  let selectedAddons = new Set();

  // Populate add‑on tags
  addons.forEach(item => {
    const div = document.createElement('div');
    div.classList.add('addon-item');
    div.textContent = `${item.addon} (+$${item.prices[0]})`;
    div.dataset.addonName = item.addon;
    div.dataset.addonPrice = item.prices[0];
    div.addEventListener('click', () => {
      if (div.classList.contains('selected')) {
        div.classList.remove('selected');
        selectedAddons.delete(item.addon);
      } else {
        div.classList.add('selected');
        selectedAddons.add(item.addon);
      }
      updateTotal();
    });
    addonsContainer.appendChild(div);
  });

  // Listen for changes on breed or service
  breedSelect.addEventListener('change', updateTotal);
  serviceSelect.addEventListener('change', updateTotal);

  function updateTotal() {
    const breedName = breedSelect.value;
    const serviceKey = serviceSelect.value;
    let basePrice = 0;
    const breed = breeds.find(b => b.breed === breedName);
    if (breed && breed.prices[serviceKey] != null) {
      basePrice = Number(breed.prices[serviceKey]);
    } else {
      basePrice = 0;
    }
    // Sum add‑ons
    let addonsPrice = 0;
    selectedAddons.forEach(name => {
      const addon = addons.find(a => a.addon === name);
      if (addon) {
        // If multiple price options exist, use the first by default
        addonsPrice += Number(addon.prices[0]);
      }
    });
    const total = basePrice + addonsPrice;
    // Update display
    if (basePrice === 0) {
      totalDisplay.textContent = 'Estimated total: N/A';
    } else {
      totalDisplay.textContent = `Estimated total: $${total.toFixed(2)}`;
    }
  }

  // Initial calculation
  updateTotal();

  submitBtn.addEventListener('click', event => {
    event.preventDefault();
    // Build inquiry summary
    const breedName = breedSelect.value;
    const serviceKey = serviceSelect.value;
    const serviceLabel = {
      bath_brush: 'Bath & Brush',
      bath_tidy: 'Bath & Tidy',
      cut_style: 'Cut & Style'
    }[serviceKey];
    const addonsArr = Array.from(selectedAddons);
    const notes = document.getElementById('notes').value.trim();
    const totalText = totalDisplay.textContent.replace('Estimated total: ', '');
    // Compose message
    const messageLines = [];
    messageLines.push(`Breed: ${breedName}`);
    messageLines.push(`Service: ${serviceLabel}`);
    if (addonsArr.length > 0) {
      messageLines.push(`Add‑ons: ${addonsArr.join(', ')}`);
    }
    if (notes) {
      messageLines.push(`Notes: ${notes}`);
    }
    messageLines.push(`Quote: ${totalText}`);
    const inquiryBody = encodeURIComponent(messageLines.join('\n'));
    const subject = encodeURIComponent('Grooming Estimate Request');
    // Use mailto to pre‑fill an email to the front desk. Replace the address with your actual contact.
    const mailtoLink = `mailto:reston@mollysdogcare.com?subject=${subject}&body=${inquiryBody}`;
    window.location.href = mailtoLink;
  });
}