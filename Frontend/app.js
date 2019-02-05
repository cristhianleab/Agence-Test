let leftPanelArr = new Array();
let selectionArr = new Array();
let rightPanelArr = new Array();
let filteredConsultants = new Array();
let averageArr = new Array();
let fromPeriodMm;
let fromPeriodYy;
let toPeriodMm;
let toPeriodYy;

function getConsultants() {
    $.get("http://127.0.0.1:3000/consultants", function (data, status) {
        leftPanelArr = data;
        buildPanels();
    });
}

function filterByDate(consultants) {
    filteredConsultants = [];

    for (let i = 0; i < consultants.length; i++) {
        let arr = new Array();
        for (let j = 0; j < consultants[i][2].length; j++) {
            let date = consultants[i][2][j].split(" ");
            let month = monthToNumber(date[0]);
            let year = date[1];
            let checkDate = year + '-' + month + '-1';
            let checkFrom = fromPeriodYy + '-' + fromPeriodMm + '-1';
            let checkTo = toPeriodYy + '-' + toPeriodMm + '-30';

            if (moment(checkDate).isBetween(checkFrom, checkTo)) {
                arr.push([consultants[i][2][j],
                    consultants[i][3][j],
                    consultants[i][4][j],
                    consultants[i][5][j],
                    consultants[i][6][j]
                ]);
            }
        }
        filteredConsultants.push([consultants[i][0], consultants[i][1], arr]);
    }
}

function relatorioRequest(consultants) {
    let data = new Array();

    data = JSON.stringify(consultants);

    $.ajax({
        url: 'http://127.0.0.1:3000/filterConsultants',
        contentType: 'application/json',
        data: data,
        type: 'POST',
        success: function (data, textStatus, jqXHR) {
            console.log("success");
            averageArr = data;
            filterByDate(data);
            buildRelatorio(filteredConsultants);
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.log("error");
        }
    });

}

function monthToNumber(month) {
    return new Date(Date.parse(month + " 1, 2012")).getMonth() + 1;
}

function buildRelatorio(consultants) {
    $("#relatorio").show();
    $("#grafico").hide();
    $("#pizza").hide();

    $("#relatorio").html("");

    let h1 = document.createElement('h1');
    h1.classList = "text-center";
    h1.innerHTML = "Relatorio";
    $("#relatorio").append(h1);

    //For each consultant
    for (let i = 0; i < consultants.length; i++) {
        let div = document.createElement('div');
        div.classList = "mb-3 bg-white border tableContainer";
        $("#relatorio").append(div);

        let conName = document.createElement('p');
        conName.classList = "pt-2 font-weight-bold ml-2";
        conName.innerHTML = consultants[i][1];
        div.appendChild(conName);

        let table = document.createElement('table');
        table.classList = "table table-bordered";
        div.appendChild(table);

        let thead = document.createElement('thead');
        table.appendChild(thead);

        let tr = document.createElement('tr');
        thead.appendChild(tr);

        //Table title
        tr.innerHTML = '<th scope="col">Período</th>' +
            '<th scope="col">Receita Líquida</th>' +
            '<th scope="col">Custo Fixo</th>' +
            '<th scope="col">Comissão</th>' +
            '<th scope="col">Lucro</th>';

        let tbody = document.createElement('tbody');
        table.appendChild(tbody);

        //For each consultant spec
        for (let j = 0; j < consultants[i][2].length; j++) {
            let trBody = document.createElement('tr');
            tbody.appendChild(trBody);

            let td1 = document.createElement('td');
            td1.innerHTML = consultants[i][2][j][0]; //spec 1
            trBody.appendChild(td1);

            let td2 = document.createElement('td');
            td2.innerHTML = consultants[i][2][j][1]; //spec 2
            trBody.appendChild(td2);

            let td3 = document.createElement('td');
            td3.innerHTML = parseFloat(consultants[i][2][j][2]).toFixed(2); //spec 3
            trBody.appendChild(td3);

            let td4 = document.createElement('td');
            td4.innerHTML = parseFloat(consultants[i][2][j][3]).toFixed(2); //spec 4
            trBody.appendChild(td4);

            let td5 = document.createElement('td');
            td5.innerHTML = parseFloat(consultants[i][2][j][4]).toFixed(2); //spec 5
            trBody.appendChild(td5);
        }
    }
}

function graficosRequest(consultants, panel) {
    let data = new Array();

    data = JSON.stringify(consultants);

    $.ajax({
        url: 'http://127.0.0.1:3000/graficos',
        contentType: 'application/json',
        data: data,
        type: 'POST',
        success: function (data, textStatus, jqXHR) {
            console.log("success");
            if (panel == 'grafico') {
                buildGrafico(data);
            } else {
                buildPizza(data);
            }
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.log("error");
        }
    });
}

function buildGrafico(consultants) {
    $("#grafico").show();
    $("#relatorio").hide();
    $("#pizza").hide();

    $("#grafico").html("");
    let labelsArr = new Array();
    let dataArr = new Array();

    for (let i = 0; i < consultants.length; i++) {
        labelsArr.push(consultants[i][1]);
        dataArr.push(parseFloat(consultants[i][2]));
    }

    let canvas = document.createElement('canvas');
    $("#grafico").append(canvas);

    let ctx = canvas.getContext('2d');
    var barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labelsArr,
            datasets: [{
                label: "Receita total",
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: dataArr,
            }]
        }
    });

    //Promedio costo fijo
    let lineData = 0;

    for (let i = 0; i < averageArr.length; i++) {
        for (let j = 0; j < averageArr[i][4].length; j++) {
            lineData += parseFloat(averageArr[i][4][j]);
        }
    }

    lineData = lineData / averageArr.length;

    let canvas2 = document.createElement('canvas');
    $("#grafico").append(canvas2);

    let ctx2 = canvas2.getContext('2d');
    var averageChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ["Custo fixo promedio"],
            datasets: [{
                label: "Custo fixo promedio",
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: [lineData],
            }]
        }
    });
}

function buildPizza(consultants) {
    $("#pizza").show();
    $("#grafico").hide();
    $("#relatorio").hide();

    $("#pizza").html("");
    let labelsArr = new Array();
    let dataArr = new Array();

    for (let i = 0; i < consultants.length; i++) {
        labelsArr.push(consultants[i][1]);
        dataArr.push(parseFloat(consultants[i][2]));
    }

    let canvas = document.createElement('canvas');
    $("#pizza").append(canvas);

    let ctx = canvas.getContext('2d');
    var pizzaChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labelsArr,
            datasets: [{
                label: "Receita total",
                backgroundColor: ["#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", "#c45850", "#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", "#c45850"],
                data: dataArr,
            }]
        },

        options: {}
    });
}

function fillSelectionArr(consultant, p) {
    if (p.classList.value == "text-success") {
        if (selectionArr.length != 0) {
            for (let i = 0; i < selectionArr.length; i++) {
                if (selectionArr[i].co_usuario != consultant.co_usuario) {
                    selectionArr.push(consultant);
                    break;
                }
            }
        } else {
            selectionArr.push(consultant);
        }
    } else {
        for (let i = 0; i < selectionArr.length; i++) {
            if (selectionArr[i].co_usuario == consultant.co_usuario) {
                selectionArr.splice(i, 1);
            }
        }
    }
}

function buildPanels() {
    //Left panel
    $("#leftPanel").html("");
    if (leftPanelArr.length != 0) {
        for (let i = 0; i < leftPanelArr.length; i++) {
            let p = document.createElement('p');
            p.innerHTML = leftPanelArr[i].no_usuario;
            p.style.cursor = "pointer";
            p.onclick = function () {
                $(this).toggleClass("text-success");
                fillSelectionArr(leftPanelArr[i], this);
            }

            $("#leftPanel").append(p);
        }
    }

    //Rigth panel
    $("#rightPanel").html("");
    if (rightPanelArr.length != 0) {
        if (rightPanelArr.length != 0) {
            for (let i = 0; i < rightPanelArr.length; i++) {
                let p = document.createElement('p');
                p.innerHTML = rightPanelArr[i].no_usuario;
                p.style.cursor = "pointer";
                p.onclick = function () {
                    $(this).toggleClass("text-success");
                    fillSelectionArr(rightPanelArr[i], this);
                }

                $("#rightPanel").append(p);
            }
        }
    }
}

function fillPanel(option) {
    //consultant to right panel
    if (selectionArr.length != 0) {
        if (option == 'add') {
            for (let i = 0; i < selectionArr.length; i++) {
                for (let j = 0; j < leftPanelArr.length; j++) {
                    if (selectionArr[i].co_usuario == leftPanelArr[j].co_usuario) {
                        leftPanelArr.splice(j, 1);
                    }
                }

                rightPanelArr.push(selectionArr[i]);
            }
        }

        //consultant to left panel
        if (option == 'del') {
            for (let i = 0; i < selectionArr.length; i++) {
                for (let j = 0; j < rightPanelArr.length; j++) {
                    if (selectionArr[i].co_usuario == rightPanelArr[j].co_usuario) {
                        rightPanelArr.splice(j, 1);
                    }
                }

                leftPanelArr.push(selectionArr[i]);
            }
        }
    } else {
        alert("No hay consultores seleccionados");
    }

    selectionArr = [];
    buildPanels();
}

function buildPeriod() {
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    //Months
    for (let i = 0; i < months.length; i++) {
        let option = document.createElement('option');
        option.innerHTML = months[i];
        $("#fromMm, #toMm").append(option);
    }

    //Years
    for (let i = 2006; i < 2010; i++) {
        let option = document.createElement('option');
        option.innerHTML = i;
        $("#fromYy, #toYy").append(option);
    }
}

function main() {
    $("#relatorioButton").click(function () {
        if (rightPanelArr.length != 0) {
            relatorioRequest(rightPanelArr);
        } else {
            alert("Debes añadir al menos un consultor");
        }
    });

    $("#graficoButton").click(function () {
        if (rightPanelArr.length != 0) {
            graficosRequest(rightPanelArr, 'grafico');
        } else {
            alert("Debes añadir al menos un consultor");
        }
    });

    $("#pizzaButton").click(function () {
        if (rightPanelArr.length != 0) {
            graficosRequest(rightPanelArr, 'pizza');
        } else {
            alert("Debes añadir al menos un consultor");
        }
    })

    $("#rightPanel").click(function () {
        $("#addButton").prop('disabled', true);
        $("#delButton").prop('disabled', false);
    });

    $("#leftPanel").click(function () {
        $("#addButton").prop('disabled', false);
        $("#delButton").prop('disabled', true);
    });

    buildPeriod();
    getConsultants();

    fromPeriodMm = monthToNumber($("#fromMm").val());
    $("#fromMm").change(function () {
        fromPeriodMm = monthToNumber($("#fromMm").val());
    });

    fromPeriodYy = $("#fromYy").val();
    $("#fromYy").change(function () {
        fromPeriodYy = $("#fromYy").val();
    });

    toPeriodMm = monthToNumber($("#toMm").val());
    $("#toMm").change(function () {
        toPeriodMm = monthToNumber($("#toMm").val());
    });

    toPeriodYy = $("#toYy").val();
    $("#toYy").change(function () {
        toPeriodYy = $("#toYy").val();
    });
}

window.onload = function () {
    main();
}