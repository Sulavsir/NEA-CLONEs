const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

let users = [];
let customers = {};

const generateConsumerId = () => `C-${Math.floor(1000 + Math.random() * 9000)}`;
const generateScNo = () => `SC-${Math.floor(1000 + Math.random() * 9000)}`;

const generateBill = (consumerId, scNo) => {
    const billNumber = Math.floor(100000 + Math.random() * 900000).toString();
    const currentReadings = Math.floor(10000 + Math.random() * 90000).toString();
    const previousReadings = (parseInt(currentReadings) - Math.floor(Math.random() * 100)).toString();
    const billAmount = (Math.random() * 1000 + 500).toFixed(2);
    return {
        bill_number: billNumber,
        bill_amount: billAmount,
        bill_date: new Date().getFullYear().toString(),
        current_readings: currentReadings,
        previous_readings: previousReadings,
        payment_status: 'Unpaid',
        consumer_id: consumerId,
        sc_no: scNo,
        counter: 'Lokanthali'
    };
};

app.get('/', (req, res) => {
    if (req.session.user) {
        const customerName = req.session.user;
        res.render('index', { user: customerName, customer: customers[customerName] });
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);
    if (user && user.password === password) {
        req.session.user = username;
        if (!customers[username]) {
            // Auto-generate consumerId and scNo
            const consumerId = generateConsumerId();
            const scNo = generateScNo();
            customers[username] = {
                full_name: username,
                mobile: 'N/A',
                address: 'N/A',
                counter: 'Lokanthali',  // Set default value for counter
                demand_type: 'home',
                consumer_id: consumerId,
                sc_no: scNo,
                bills: [generateBill(consumerId, scNo)]
            };
        }
        res.redirect('/');
    } else {
        res.status(401).send('Invalid credentials');
    }
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    const { username, email, password_1, password_2, mobile, address } = req.body;
    if (password_1 !== password_2) {
        res.status(400).send('Passwords do not match');
    } else if (users.find(user => user.username === username)) {
        res.status(400).send('User already exists');
    } else {
        // Auto-generate consumerId and scNo
        const consumerId = generateConsumerId();
        const scNo = generateScNo();
        users.push({ username, email, password: password_1 });
        customers[username] = {
            full_name: username,
            mobile: mobile,
            address: address,
            counter: 'Lokanthali', // default to Lokanthali
            demand_type: 'home',
            consumer_id: consumerId,
            sc_no: scNo,
            bills: [generateBill(consumerId, scNo)]
        };
        res.redirect('/login');
    }
});

app.post('/search', (req, res) => {
    const { name, mobile } = req.body;
    for (const customerName in customers) {
        if (name === customerName || mobile === customers[customerName].mobile) {
            res.render('index', { user: req.session.user, customer: customers[customerName] });
            return;
        }
    }
    res.status(404).send('Customer not found');
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
