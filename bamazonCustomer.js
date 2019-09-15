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


// connect to the mysql server and sql database
connection.connect(function (err) {
    if (err) throw err;
    // run the start function after the connection is made to prompt the user
    start();
});

function start() {
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
        console.log("=============================================================================");
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
                message: "What item would you like to buy? (Select by item ID)"
            }, {
                name: "numberDesired",
                type: "input",
                message: "How many would you like to buy?"
            }]).then(function (answer) {
                var chosenAnswer;
                for (var i = 0; i < results.length; i++) {
                    if (results[i].item_id === answer.itemDesired) {
                        chosenAnswer = results[i]
                    }
                }
                setTimeout(function () {
                    if (chosenAnswer.stock_quantity < parseInt(answer.numberDesired)) {
                        haggle(chosenAnswer);
                    } else {
                        var itemsbought = answer.numberDesired;
                        console.log("\nGreat, we'll move on with the purchase of " + itemsbought + " units!");
                        connection.query(
                            "UPDATE products SET ? WHERE ?",
                            [{
                                    stock_quantity: parseInt(chosenAnswer.stock_quantity) - parseInt(answer.numberDesired)
                                },
                                {
                                    item_id: chosenAnswer.item_id
                                }
                            ],
                            function (error) {
                                if (error) throw err;
                                console.log("Transaction placed successfully!");
                                console.log("Amount owed: $" + (itemsbought * chosenAnswer.price) + '\n\n');
                                console.log("jumping back to the main menu \n");
                                setTimeout(start, 3000);
                            }
                        );
                    }
                }, 10)
            })
    });
};



function haggle(item) {
    inquirer
        .prompt([{
            name: "confirm",
            type: "confirm",
            message: "We do not have the stock to meet your request. Do you want to buy what we have left?"
        }]).then(function (answer) {
            if (answer.confirm === true) {
                var itemsbought = item.stock_quantity
                console.log("\n Great, we'll move on with the purchase of " + itemsbought + " units!");
                connection.query(
                    "UPDATE products SET ? WHERE ?",
                    [{
                            stock_quantity: 0
                        },
                        {
                            item_id: item.item_id
                        }
                    ],
                    function (error) {
                        if (error) throw err;
                        console.log("Transaction placed successfully!");
                        console.log("Amount owed: $" + (itemsbought * item.price) + '\n\n');
                        setTimeout(start, 3000);
                    }
                );
            }
            console.log("We're sorry for the inconvenience, jumping back to the main menu \n");
            setTimeout(start, 2000);
        })
}