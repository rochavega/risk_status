async function calculateRisk() {
    const input = document.getElementById("gridIdsInput").value;
    const gridIds = input.split(",").map(id => id.trim()).filter(id => id.length > 0);

    if (gridIds.length === 0) {
        document.getElementById("result").innerText = "Please enter at least one Grid ID.";
        return;
    }

    const featureServiceUrl = "https://services3.arcgis.com/v7iE2qiYIiE1joi6/arcgis/rest/services/Grid_20x20_Deforest_Final_pol_status/FeatureServer/0/query";
    const whereClause = gridIds.map(id => `id_grid2='${id}'`).join(" OR ");

    var s_3000 = 3000;
    var s_1000 = 1000;
    var s_300 = 300;
    var cdf = 0.0
    var total = 0;
    var calc = false;

    function processOneData(data) {
        data.features.forEach(feature => {
                    var sample = Math.floor(s_3000 / feature.attributes.field_si_1)
                    if(feature.attributes.Eligible == 0){
                        total = 1
                        return
                    }
                    else if(feature.attributes.def_1 == 0){
                        total = 0
                        return
                    }
                    else if (sample > feature.attributes.Total_1) {
                        sample = s_1000 / feature.attributes.field_si_1;

                        if (sample > feature.attributes.Total_1) {
                            sample = s_300 / feature.attributes.field_si_1;

                            if (sample > feature.attributes.Total_1) {
                                sample = s_3000 / feature.attributes.UCSBACRES;

                                if (sample > feature.attributes.Total_1) {
                                    sample = s_1000 / feature.attributes.UCSBACRES;

                                    if (sample > feature.attributes.Total_1) {
                                        sample = s_300 / feature.attributes.UCSBACRES;
                                    }
                                }
                            }
                        }
                    }
                    
                    //const cdf = jStat.hypgeom.cdf(k, N, K, n);
                    cdf = 1 - (jStat.hypgeom.cdf(0, feature.attributes.Total_1, feature.attributes.def_1, parseInt(sample)));
                    if (cdf !== null && !isNaN(cdf)) {
                        total = cdf
                    }
                })};
    
    function processManyData(data) {
        var deforst_sum = 0;
        var total_fields_sum = 0;
        var field_size_sum = 0;
        var size_mean = 0;

        data.features.forEach(feature => {
            deforst_sum += feature.attributes.def_1;
            total_fields_sum += feature.attributes.Total_1;
            field_size_sum += feature.attributes.field_si_1;
        });
            console.log(field_size_sum)
            size_mean = field_size_sum / data.features.length
            console.log(total_fields_sum)
            console.log(deforst_sum)
            console.log(size_mean)
            var sample = Math.floor(s_3000 / size_mean)
            console.log(sample)

            cdf = 1 - (jStat.hypgeom.cdf(0, total_fields_sum, deforst_sum, parseInt(sample)));
            console.log(cdf)
            if (cdf !== null && !isNaN(cdf)) {
                total = cdf;
                count = data.length;
                calc = true
            }else{
                calc = false
            }


    }

    const params = new URLSearchParams({
        where: whereClause,
        outFields: "id_grid2,field_si_1,Total_1,def_1,UCSBACRES,Eligible",
        f: "json"
    });

    try {
        const response = await fetch(`${featureServiceUrl}?${params}`);
        const data = await response.json();

        if (!data.features || data.features.length === 0) {
            document.getElementById("result").innerText = "No matching grids found.";
            return;
        }

        if (data.features.length > 1){
            console.log("maior que 1")
            console.log(data.features.length)
            processManyData(data)
        }
        if(calc == false){
            console.log("igual a 1")
            console.log(data.features.length)
            processOneData(data)
        }

        console.log(total)
        console.log(calc)
        if (data.features.length === 0) {
            document.getElementById("result").innerText = "No valid values found.";
            return;
        }

        //average = total / count;
        console.log(total)
        var average = total
        console.log("------")

        // Definir status com base na média
        let riskStatus = "";

        if (average < 0.2) {
            riskStatus = "Very Low";
        } else if (average < 0.35) {
            riskStatus = "Low";
        } else if (average < 0.65) {
            riskStatus = "Medium";
        } else if (average < 0.80) {
            riskStatus = "High";
        } else {
            riskStatus = "Very High";
        }
        //average.toFixed(2)
        document.getElementById("result").innerHTML = `
            <strong>Prob:</strong> ${(average.toFixed(4) * 100)}%<br>
            <strong>Risk Status:</strong> ${riskStatus}
        `;

    } catch (error) {
        console.error("Error querying Feature Service:", error);
        document.getElementById("result").innerText = "Error fetching data.";
    }
}
