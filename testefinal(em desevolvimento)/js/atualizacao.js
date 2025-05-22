fetch('http://10.46.11.7/testefinal/php/automatico_web.php')
  .then(response => response.text()) // Obtém a resposta como texto
  .then(text => {
    if (text.startsWith('<!DOCTYPE')) {
      console.error('Erro: a resposta não é um JSON válido.', text);
    } else {
      try {
        const data = JSON.parse(text);
        console.log('Dados carregados:', data);
      } catch (error) {
        console.error('Erro ao processar JSON:', text);
      }
    }
  });