var Product = require('../models/product');
var User = require('../models/user');
var mongoose = require('mongoose');
var faker = require('faker');
var Config = require('../config/config');
var connectionstring = 'mongodb://' + Config.dbhost + ':' + Config.dbport + '/' + Config.dbname;
mongoose.connect(connectionstring);
mongoose.Promise = global.Promise;

products = [];
brands = ['MongoDB', 'Fubu', 'Sean Jean'];
fabrics = ['wool', 'fur', 'fleece', 'paper', 'acrylic pellets', 'hemp'];
types = ['pullover', 'tee-shirt', 'pantsuit', 'jacket', 'vest'];
var done = 0;
for (var i = 0; i < 100; i++) {


    var numUsers = Math.floor(Math.random() * (10 - 2 + 1)) + 2;
    User.aggregate([{
        $sample: {
            size: numUsers
        }
    }, {
        $project: {
            _id: 1
        }
    }], function(err, usersArray) {
        if (err) {
            console.log(err);
        }
        var items = []
        for (user in usersArray) {
            items.push(usersArray[user]._id);
        };
    var code = 1000 + i;
    var color = faker.commerce.color();
    var materialBrand = faker.commerce.productMaterial();
    typeNum = Math.floor((Math.random() * brands.length - 1) + 1);
    brandNum = Math.floor((Math.random() * brands.length - 1) + 1);
    fabricNum = Math.floor((Math.random() * fabrics.length - 1) + 1);
    type = types[typeNum];
    fabric = fabrics[fabricNum];
    brand = brands[brandNum];
    imagePath = '/img/' + type + '-clothes.jpg'
    var category = 'Apparel';
    name = faker.commerce.productName() + ' ' + type;
    price = faker.commerce.price();
        product = new Product({
            code: 'cam' + code,
            name: name,
            title: brand + ' ' + faker.commerce.productAdjective() + ' ' + color + ' ' + name,
            description: faker.lorem.sentence(),
            taxable: 'Yes',
            shipable: 'Yes',
            price: price,
            'Product_Group': 'Apparel',
            category: 'Apparel',
            usersBought: items,
            Attributes: [{
                Name: 'color',
                Value: color
            }, {
                Name: 'brand',
                Value: brand
            }, {
                Name: "Fabric",
                Value: fabric
            }, {
                Name: 'Price',
                Value: price
            }],
            imagePath: imagePath,
            likes: ["123321", "232122", "1232123", "d03k1231", "1231kdf1"]
        });

        product.save(function(err,productId) {
            if (err) {
                console.log('error: ', err.message);
            }
            for(user in usersArray) {
                items.push(usersArray[user]._id);
                User.update({_id: usersArray[user]._id},{$push: {"purchased": productId._id }})
            };
        });
        done++;
        if (done == 100) {
            exit();
        }
    });
}

function exit() {
    mongoose.disconnect();
}
