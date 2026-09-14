export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/919022302322?text=Hi%20TeKVora!%20I%20want%20to%20know%20more."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-7 right-7 z-[9999] w-[60px] h-[60px] bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-lg whatsapp-pulse hover:scale-110 transition-transform duration-200"
      aria-label="Chat on WhatsApp"
    >
      <i className="fab fa-whatsapp text-3xl"></i>
    </a>
  );
}
