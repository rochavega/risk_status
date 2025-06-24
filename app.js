async function calculateRisk() {
    const input = document.getElementById("gridIdsInput").value;
    const gridIds = input.split(",").map(id => id.trim()).filter(id => id.length > 0);

    if (gridIds.length === 0) {
        document.getElementById("result").innerText = "Please enter at least one Grid ID.";
        return;
    }

    const featureServiceUrl = "https://services3.arcgis.com/v7iE2qiYIiE1joi6/arcgis/rest/services/Grid_20x20_Deforest_Final_pol_status/FeatureServer/0/query";
    const whereClause = gridIds.map(id => `id_grid2='${id}'`).join(" OR ");

    const params = new URLSearchParams({
        where: whereClause,
        outFields: "id_grid2,poc_3000",
        f: "json"
    });

    try {
        const response = await fetch(`${featureServiceUrl}?${params}`);
        const data = await response.json();

        if (!data.features || data.features.length === 0) {
            document.getElementById("result").innerText = "No matching grids found.";
            return;
        }

        // Calcular média da coluna poc_3000
        let total = 0;
        let count = 0;

        data.features.forEach(feature => {
            const value = feature.attributes.poc_3000 * 100;
            if (value !== null && !isNaN(value)) {
                total += value;
                count++;
            }
        });

        if (count === 0) {
            document.getElementById("result").innerText = "No valid poc_3000 values found.";
            return;
        }

        const average = total / count;

        // Definir status com base na média
        let riskStatus = "";

        if (average < 20) {
            riskStatus = "Very Low";
        } else if (average < 35) {
            riskStatus = "Low";
        } else if (average < 65) {
            riskStatus = "Medium";
        } else if (average < 80) {
            riskStatus = "High";
        } else {
            riskStatus = "Very High";
        }

        document.getElementById("result").innerHTML = `
            <strong>Average poc_3000:</strong> ${average.toFixed(2)}%<br>
            <strong>Risk Status:</strong> ${riskStatus}
        `;

    } catch (error) {
        console.error("Error querying Feature Service:", error);
        document.getElementById("result").innerText = "Error fetching data.";
    }
}
