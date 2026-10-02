const BIO_PHONE = '5585989181727';
document.querySelectorAll('[data-wa]').forEach(link => {
  link.href = `https://wa.me/${BIO_PHONE}?text=${encodeURIComponent(link.dataset.wa)}`;
  link.target = '_blank';
  link.rel = 'noopener';
});
