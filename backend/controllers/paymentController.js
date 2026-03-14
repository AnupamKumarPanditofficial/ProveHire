const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

// @desc    Create Stripe Checkout Session
// @route   POST /api/payments/create-checkout-session
// @access  Private (Candidate)
exports.createCheckoutSession = async (req, res) => {
    try {
        const { planName, priceAmount } = req.body;
        const user = req.user;

        if (!planName || !priceAmount) {
            return res.status(400).json({ message: 'Plan name and price are required' });
        }

        // Create or retrieve Stripe Customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.fullName,
                metadata: { userId: user._id.toString() }
            });
            customerId = customer.id;
            user.stripeCustomerId = customerId;
            await user.save();
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: `ProvaHire ${planName} Plan`,
                            description: `Upgrade to ProvaHire ${planName} for premium features.`,
                        },
                        unit_amount: priceAmount * 100, // Stripe expects amount in paise
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/payment/cancel`,
            metadata: {
                userId: user._id.toString(),
                planName: planName
            }
        });

        res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe Session Error:', error);
        res.status(500).json({ message: 'Error creating checkout session', error: error.message });
    }
};

// @desc    Stripe Webhook Handler
// @route   POST /api/payments/webhook
// @access  Public
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const planName = session.metadata.planName;

        try {
            const user = await User.findById(userId);
            if (user) {
                user.subscriptionPlan = planName;
                // Set expiry to 30 days from now
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + 30);
                user.planExpiry = expiry;
                await user.save();
                console.log(`User ${userId} upgraded to ${planName}`);
            }
        } catch (error) {
            console.error('Error updating user subscription via webhook:', error);
        }
    }

    res.json({ received: true });
};
