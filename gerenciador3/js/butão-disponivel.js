function reservarVeiculo(nome, placa, ano, cor) {
    const veiculo = {
        nome: nome,
        placa: placa,
        ano: ano,
        cor: cor
    };


    const veiculoJSON = JSON.stringify(veiculo);
    const veiculoEncoded = encodeURIComponent(veiculoJSON);


    window.location.href = `/trabalho/index/chamados.html?veiculo=${veiculoEncoded}`;
}