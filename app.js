// Provide reference receipt records.
const orders = [
	{
		id: 1,
		title: 'Order 1',
		date: '2025-04-06T09:30:00.000Z',
		description: 'Office display delivery',
		get products() {
			return products.filter((product) => product.order === this.id);
		},
	},
	{
		id: 2,
		title: 'Order 2',
		date: '2025-03-28T13:15:00.000Z',
		description: 'Studio equipment delivery',
		get products() {
			return products.filter((product) => product.order === this.id);
		},
	},
];

// Keep product examples linked.
const products = [
	{
		id: 1,
		serialNumber: 'SN-1201',
		isNew: true,
		photo: '',
		title: 'StudioView 27-inch Monitor',
		type: 'Monitors',
		specification: '27 in · 4K UHD · USB-C',
		guarantee: {
			start: '2025-04-06T00:00:00.000Z',
			end: '2028-04-06T00:00:00.000Z',
		},
		price: [
			{ value: 629, symbol: 'USD', isDefault: false },
			{ value: 25900, symbol: 'UAH', isDefault: true },
		],
		order: 1,
		date: '2025-04-06T09:30:00.000Z',
	},
	{
		id: 2,
		serialNumber: 'SN-1202',
		isNew: false,
		photo: '',
		title: 'Mechanical Keyboard Pro',
		type: 'Keyboards',
		specification: 'Mechanical · US layout',
		guarantee: {
			start: '2025-03-28T00:00:00.000Z',
			end: '2027-03-28T00:00:00.000Z',
		},
		price: [
			{ value: 189, symbol: 'USD', isDefault: false },
			{ value: 7800, symbol: 'UAH', isDefault: true },
		],
		order: 2,
		date: '2025-03-28T13:15:00.000Z',
	},
];

module.exports = { orders, products };
