// Импортируем модуль vscode для работы с API Visual Studio Code
const vscode = require('vscode');
// Импортируем axios для выполнения HTTP-запросов
const axios = require('axios');

// Функция активации расширения
function activate(context) {
  // Регистрируем команду 'extension.translate', которая будет вызываться из командной палитры
  let disposable = vscode.commands.registerCommand('extension.translate', async () => {
    // Получаем активный редактор
    const editor = vscode.window.activeTextEditor;
    // Если редактор не открыт, выходим из функции
    if (!editor) {
      return;
    }

    // Получаем выделенный текст из редактора
    const selectedText = editor.document.getText(editor.selection);
    // Если текст не выделен, показываем сообщение об ошибке
    if (!selectedText) {
      vscode.window.showErrorMessage('Выделите текст для перевода');
      return;
    }

    try {
      // Вызываем функцию для перевода текста
      const translatedText = await translateText(selectedText);
      // Заменяем выделенный текст на переведенный текст в редакторе
      editor.edit((editBuilder) => {
        editBuilder.replace(editor.selection, translatedText);
      });
      // Показываем сообщение о том, что текст переведен
      vscode.window.showInformationMessage('Текст переведен!');
    } catch (error) {
      // Если произошла ошибка, показываем сообщение об ошибке
      vscode.window.showErrorMessage('Ошибка при переводе текста');
    }
  });

  // Добавляем команду в список подписок контекста, чтобы она была очищена при деактивации
  context.subscriptions.push(disposable);
}

// Асинхронная функция для перевода текста
async function translateText(text) {
  const maxChunkLength = 500; // Максимальная длина для каждого сегмента текста
  const chunks = []; // Массив для хранения сегментов текста

  // Разбиваем текст на части длиной до maxChunkLength символов
  for (let i = 0; i < text.length; i += maxChunkLength) {
    chunks.push(text.slice(i, i + maxChunkLength)); // Добавляем сегмент в массив
  }

  // Массив для хранения переведенных частей текста
  const translatedChunks = [];
  // Переводим каждый кусок отдельно с задержкой, чтобы уменьшить вероятность потери данных
  for (const chunk of chunks) {
    const translatedChunk = await translateChunk(chunk); // Переводим сегмент
    translatedChunks.push(translatedChunk); // Добавляем переведенный сегмент в массив

    // Задержка в 100 мс между запросами, чтобы избежать блокировки
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Объединяем все переведенные части в одно предложение и возвращаем
  return translatedChunks.join(' ');
}

// Асинхронная функция для перевода отдельного сегмента текста
async function translateChunk(chunk) {
  // Формируем URL для запроса к API Google Translate
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=en&dt=t&q=${encodeURIComponent(chunk)}`;
  // Выполняем GET-запрос к API
  const response = await axios.get(url);

  // Обрабатываем вложенные массивы данных и возвращаем переведенный текст
  return response.data[0].map((item) => item[0]).join('');
}

// Функция деактивации расширения
function deactivate() {}

// Экспортируем функции активации и деактивации
module.exports = {
  activate,
  deactivate
};
