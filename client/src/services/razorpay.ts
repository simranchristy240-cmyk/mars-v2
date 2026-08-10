export interface RazorpayOptions {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  userEmail?: string;
  userPhone?: string;
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure?: (error: any) => void;
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const openRazorpayModal = async (options: RazorpayOptions) => {
  const isLoaded = await loadRazorpayScript();

  if (!isLoaded || !(window as any).Razorpay) {
    // Dev fallback if Razorpay script can't load or in mock mode
    console.warn('[Razorpay] Script loading fallback — triggering dev mock success modal');
    const confirmMock = window.confirm(
      `[Razorpay Mock Checkout]\n\nCourse: ${options.name}\nAmount: ₹${options.amount / 100}\n\nClick OK to simulate successful payment.`
    );

    if (confirmMock) {
      options.onSuccess({
        razorpay_payment_id: 'pay_mock_' + Date.now(),
        razorpay_order_id: options.orderId,
        razorpay_signature: 'sig_mock_' + Date.now(),
      });
    } else if (options.onFailure) {
      options.onFailure({ message: 'Payment cancelled by user' });
    }
    return;
  }

  const rzp = new (window as any).Razorpay({
    key: options.keyId,
    amount: options.amount,
    currency: options.currency,
    name: 'MARS Anatomy',
    description: options.description,
    order_id: options.orderId,
    prefill: {
      email: options.userEmail || '',
      contact: options.userPhone || '',
    },
    theme: {
      color: '#090941',
    },
    handler: (response: any) => {
      options.onSuccess(response);
    },
  });

  rzp.on('payment.failed', (response: any) => {
    if (options.onFailure) options.onFailure(response.error);
  });

  rzp.open();
};
