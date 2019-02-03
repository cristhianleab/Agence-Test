const express = require("express");
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

app.use(cors());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

const agenceDB = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'agence'
});

//Endpoints
app.post('/graficos', function (req, res) {
    let responseUser = new Array();

    for (let i = 0; i < req.body.length; i++) {
        let user = req.body[i].co_usuario;
        let user_name = req.body[i].no_usuario;
        let responseArr = new Array();

        new Promise((resolve, reject) => {
            let sql = mysql.format('SELECT * FROM `cao_os` t1 INNER JOIN `cao_fatura` t2 ON t1.co_os = t2.co_os WHERE co_usuario = ?', user);
            agenceDB.query(
                sql,
                function (err, results) {
                    resolve(results);
                }
            );
        }).then(function (result) {
            let receitaTotal = 0;
            for (let j = 0; j < result.length; j++) {
                receitaTotal += result[j].valor - (result[j].valor / 100 * result[j].total_imp_inc);
            };

            responseArr.push(user, user_name, (receitaTotal).toFixed(2));
            responseUser.push(responseArr);

            if (i == req.body.length - 1) {
                res.json(responseUser);
            }
        })
    }
});

app.post('/filterConsultants', function (req, res) {
    let responseArr = new Array();

    for (let i = 0; i < req.body.length; i++) {
        let user = req.body[i].co_usuario;
        let user_name = req.body[i].no_usuario;

        let dataArr = new Array();
        let receitaArr = new Array();
        let custofixo = new String();
        let comissaoArr = new Array();
        let lucroArr = new Array();
        let totalImp = new Array();

        new Promise((resolve, reject) => {
            let sql = mysql.format('SELECT * FROM `cao_os` t1 INNER JOIN `cao_fatura` t2 ON t1.co_os = t2.co_os WHERE co_usuario = ?', user);
            agenceDB.query(
                sql,
                function (err, results) {
                    resolve(results);
                }
            );
        }).then(function (result) {
            for (let j = 0; j < result.length; j++) {
                let data = result[j].data_emissao + '';
                //Fix data
                data = data.split(" ");
                data = data[1] + ' ' + data[3];
                dataArr.push(data);

                let receita = result[j].valor - (result[j].valor / 100 * result[j].total_imp_inc);
                receitaArr.push(receita.toFixed(2));
            };
        }).then(function () {
            new Promise((resolve, reject) => {
                let sql = mysql.format('SELECT * FROM `cao_salario` WHERE co_usuario = ?', user);
                agenceDB.query(
                    sql,
                    function (err, results) {
                        resolve(results);
                    }
                );
            }).then(function (result) {
                custofixo = result[0].brut_salario;
            }).then(function () {
                new Promise((resolve, reject) => {
                    let sql = mysql.format('SELECT * FROM `cao_os` t1 INNER JOIN `cao_fatura` t2 ON t1.co_os = t2.co_os WHERE co_usuario = ?', user);
                    agenceDB.query(
                        sql,
                        function (err, results) {
                            resolve(results);
                        }
                    );
                }).then(function (result) {
                    for (let j = 0; j < result.length; j++) {
                        let comissao = (result[j].valor - (result[j].valor / 100 * result[j].total_imp_inc)) / 100 * result[j].comissao_cn;
                        comissaoArr.push(comissao.toFixed(2));
                    };
                }).then(function () {
                    for (let j = 0; j < receitaArr.length; j++) {
                        let lucro = parseFloat(receitaArr[j]) - (parseFloat(custofixo) + parseFloat(comissaoArr[j]));
                        lucroArr.push(lucro);
                    }

                    //Sort array by date
                    let orderArray = new Array();
                    for (let i = 0; i < dataArr.length; i++) {
                        orderArray.push([dataArr[i], receitaArr[i], custofixo, comissaoArr[i], lucroArr[i]]);
                    }

                    orderArray.sort(function (a, b) {
                        var dateA = new Date(a[0]),
                            dateB = new Date(b[0]);
                        return dateA - dateB;
                    });

                    //Adding up values with same date
                    let responseUser = new Array();

                    let dataFinalArr = new Array();
                    let receitaFinalArr = new Array();
                    let comissaoFinalArr = new Array();
                    let lucroFinalArr = new Array();
                    let custofixoFinalArr = new Array();
                    let custofixoAdd = 0;
                    let receitaAdd = 0;
                    let comissaoAdd = 0;

                    for (let i = 0; i < orderArray.length; i++) {
                        if (i != orderArray.length - 1) {
                            if (i == 0) {
                                receitaAdd = parseFloat(orderArray[i][1]);
                                custofixoAdd = parseFloat(orderArray[i][2]);
                                comissaoAdd = parseFloat(orderArray[i][3]);
                            }
                            if (orderArray[i][0] == orderArray[i + 1][0]) {
                                receitaAdd += parseFloat(orderArray[i + 1][1]);
                                custofixoAdd += parseFloat(orderArray[i + 1][2]);
                                comissaoAdd += parseFloat(orderArray[i + 1][3]);
                            } else {
                                dataFinalArr.push(orderArray[i][0]);
                                receitaFinalArr.push(receitaAdd.toFixed(2));
                                custofixoFinalArr.push(custofixoAdd.toFixed(2));
                                comissaoFinalArr.push(comissaoAdd.toFixed(2));

                                receitaAdd = parseFloat(orderArray[i + 1][1]);
                                custofixoAdd = parseFloat(orderArray[i + 1][2]);
                                comissaoAdd = parseFloat(orderArray[i + 1][3]);

                            }
                        } else if (orderArray[i][0] == orderArray[i - 1][0]) {
                            dataFinalArr.push(orderArray[i][0]);
                            receitaFinalArr.push(receitaAdd.toFixed(2));
                            custofixoFinalArr.push(custofixoAdd.toFixed(2));
                            comissaoFinalArr.push(comissaoAdd.toFixed(2));
                        } else {
                            receitaAdd = parseFloat(orderArray[i][1]);
                            custofixoAdd = parseFloat(orderArray[i][2]);
                            comissaoAdd = parseFloat(orderArray[i][3]);

                            dataFinalArr.push(orderArray[i][0]);
                            receitaFinalArr.push(receitaAdd.toFixed(2));
                            custofixoFinalArr.push(custofixoAdd.toFixed(2));
                            comissaoFinalArr.push(comissaoAdd.toFixed(2));
                        }
                    }

                    for (let n = 0; n < receitaFinalArr.length; n++) {
                        lucroFinalArr.push((parseFloat(receitaFinalArr[n]) - (parseFloat(custofixoFinalArr[n]) + parseFloat(comissaoFinalArr[n]))).toFixed(2));
                    }

                    responseUser.push(user, user_name, dataFinalArr, receitaFinalArr, custofixoFinalArr, comissaoFinalArr, lucroFinalArr);
                    responseArr.push(responseUser);

                    //Send response in last user
                    if (i == req.body.length - 1) {
                        res.json(responseArr);
                    }
                });
            });
        });
    };


});

app.get("/consultants", (req, res, next) => {
    agenceDB.query(
        'SELECT * FROM `permissao_sistema` t1 INNER JOIN `cao_usuario` t2 ON t1.co_usuario = t2.co_usuario WHERE co_sistema = 1 AND in_ativo = "S" AND co_tipo_usuario in (0,1,2)',
        function (err, results, fields) {
            res.json(results);
        }
    );
});