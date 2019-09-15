require("dotenv").config();
var mysql = require("mysql");
var inquirer = require("inquirer");


// create the connection information for the sql database
var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    // Your port; if not 3306
    port: process.env.DB_PORT,
    // Your username
    user: process.env.DB_USER,
    // Your password
    password: process.env.DB_PASS,
    database: "bamazon"
});


connection.connect(function (err) {
    if (err) throw err;
    // run the start function after the connection is made to prompt the user
    start();
});

function start() {
    inquirer
        .prompt([{
            name: "action",
            type: "list",
            choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product"],
            message: "What would you like to do?"
        }]).then(function (answer) {
            switch (answer.action) {
                case "View Products for Sale":
                    ProductSummary();
                    break;
                case "View Low Inventory":
                    LowInventory();
                    break;
                case "Add to Inventory":
                    Restock();
                    break;
                case "Add New Product":
                    AddProduct();
                    break;
            }
        });
};

function ProductSummary() {
    console.log("Viewing Product Summary\n");
    connection.query("SELECT * FROM products;", function (err, results) {
        if (err) throw err;
        console.log('item_id | product_name | department_name | price | stock_quantity');
        console.log("=============================================================================");
        for (var i = 0; i < results.length; i++) {
            if (results[i].item_id < 10) {
                console.log('0' + results[i].item_id + ' | ' + results[i].product_name + ' | ' + results[i].department_name + ' | ' + results[i].price + ' | ' + results[i].stock_quantity + '\n');
            } else {
                console.log(results[i].item_id + ' | ' + results[i].product_name + ' | ' + results[i].department_name + ' | ' + results[i].price + ' | ' + results[i].stock_quantity + '\n');
            }
        }
        console.log("=============================================================================\n\n");
    });
    setTimeout(start, 2000);
};


function LowInventory() {
    console.log("Viewing Low Stock Products Summary\n");
    connection.query("SELECT * FROM products WHERE stock_quantity < 5;", function (err, results) {
        if (err) throw err;
        if (results) {
            console.log('item_id | product_name | department_name | price | stock_quantity');
            console.log("=============================================================================");
            for (var i = 0; i < results.length; i++) {
                if (results[i].item_id < 10) {
                    console.log('0' + results[i].item_id + ' | ' + results[i].product_name + ' | ' + results[i].department_name + ' | ' + results[i].price + ' | ' + results[i].stock_quantity + '\n');
                } else {
                    console.log(results[i].item_id + ' | ' + results[i].product_name + ' | ' + results[i].department_name + ' | ' + results[i].price + ' | ' + results[i].stock_quantity + '\n');
                }
            }
            console.log("=============================================================================\n\n");
        }
    });
    setTimeout(start, 2000);
};


function Restock() {
    console.log("Restocking...");
    connection.query("SELECT * FROM products;", function (err, results) {
        if (err) throw err;
        inquirer
            .prompt([{
                name: "itemDesired",
                type: "list",
                choices: function () {
                    var choiceArray = [];
                    for (var i = 0; i < results.length; i++) {
                        //choiceArray.push(results[i].item_id + ' ' + results[i].product_name);
                        choiceArray.push(results[i].item_id);
                    }
                    return choiceArray;
                },
                message: "What item would you like to restock? (Select by item ID)"
            }, {
                name: "numberDesired",
                type: "input",
                message: "How much are you adding?"
            }]).then(function (answer) {
                var chosenAnswer;
                for (var i = 0; i < results.length; i++) {
                    if (results[i].item_id === answer.itemDesired) {
                        chosenAnswer = results[i]
                    }
                }
                connection.query(
                    "UPDATE products SET ? WHERE ?",
                    [{
                            stock_quantity: parseInt(chosenAnswer.stock_quantity) + parseInt(answer.numberDesired)
                        },
                        {
                            item_id: chosenAnswer.item_id
                        }
                    ],
                    function (error) {
                        if (error) throw err;
                        console.log("Additional inventory added successfully!");
                        console.log("jumping back to the main menu \n");
                        setTimeout(start, 2000);
                    }
                );
            })
    })
};

function AddProduct() {
    inquirer
        .prompt([{
            name: "product_name",
            type: "input",
            message: "What product would you like to add?"
        }, {
            name: "department_name",
            type: "input",
            message: "What department does it belong in?"
        }, {
            name: "price",
            type: "number",
            message: "How much does it cost?"
        }, {
            name: "stock_quantity",
            type: "number",
            message: "How much did you order?"
        }]).then(function (answer) {
            connection.query("SELECT count(distinct item_id) AS numProducts FROM products", function (err, results) {
                if (err) throw err;
                var itemID = results[0].numProducts + 1;
                connection.query("INSERT INTO products SELECT ? as item_id, ? AS product_name, ? AS department_name, ? AS price, ? AS stockquantity", [itemID, answer.product_name, answer.department_name, parseInt(answer.price), parseInt(answer.stock_quantity)], function (err) {
                    if (err) throw err;
                    console.log("Successfully added " + answer.product_name + " to bamazon");
                    console.log("Jumping back to main menu \n");
                    setTimeout(start, 2000);
                })
            })
        })
}