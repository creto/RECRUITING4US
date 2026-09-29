export const CODING_FOOTER =
  "Use the language of the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site.";

export const CODING_FOOTER_ES =
  "Usa el lenguaje del editor. Un revisor califica un resultado correcto según las reglas. Si el código no es obvio, indica el enfoque en un comentario breve. Estos enunciados se escribieron para este banco. No son ejercicios de otro sitio.";

export const CODING_TITLES: Record<string, string> = {
  "Crate pair": "Par de cajas",
  "Ferry window": "Ventana del ferry",
  "Rotated shelf": "Estante rotado",
  "Badge streak": "Racha de fichajes",
  "Merge delivery windows": "Unir ventanas de entrega",
  "Station codes": "Códigos de estación",
  "Holding stack": "Pila de espera",
  "Meter except self": "Medición sin sí mismo",
  "Next richer shift": "Siguiente turno mayor",
  "Three bins": "Tres cajas",
  "Booth change": "Cambio del puesto",
  "Label groups": "Grupos de etiquetas",
  "Nearest docks": "Muelles más cercanos",
  "Room count": "Salas necesarias",
  "Digit ways": "Formas de decodificar",
  "Module order": "Orden de módulos",
  "Orchard plots": "Parcelas del huerto",
  "Floor spiral": "Espiral del plano",
  "Digit lists": "Listas de dígitos",
  "Window maximum": "Máximo de la ventana",
  "First unique in a window": "Primero único en la ventana",
  "Shift profit": "Ganancia del turno",
  "Ladder steps": "Pasos de la escalera",
  "Small cache": "Caché pequeña",
  "Grid minutes": "Minutos en la cuadrícula",
  "Serial distance": "Distancia de edición",
  "Roof water": "Agua del techo",
  "Delay median": "Mediana de demoras",
  "Badge cover": "Cobertura de insignias",
  "Free rectangle": "Rectángulo libre",
  "Simple pattern": "Patrón simple",
  "Burst order": "Orden de estallido",
  "Palindrome cuts": "Cortes de palíndromo",
  "Weave codes": "Entrelazar códigos",
  "Critical links": "Enlaces críticos",
  "Quiet boards": "Tableros en calma",
  "Envelope stack": "Pila de sobres",
  "Smaller after": "Menores después",
  "Cooldown profit": "Ganancia con espera",
  "Obstacle budget": "Presupuesto de obstáculos",
  "Bus hops": "Saltos de autobús",
  "Two pickers": "Dos recolectores",
  "Code ladder": "Escalera de códigos",
  "Badge alphabet": "Alfabeto de insignias",
  "Dictionary split": "División por diccionario",
  "Path sum": "Suma del camino",
  "Job schedule": "Agenda de trabajos",
  "Restore addresses": "Restaurar direcciones",
  "Basic calculator": "Calculadora básica",
  Skyline: "Silueta",
};

export const CODING_TASKS: Record<string, string> = {
  "Return the indexes of two different crates whose weights add up to capacity. If several pairs work, return the one with the smaller first index, then the smaller second index. Return null when none exist.":
    "Devuelve los índices de dos cajas distintas cuyos pesos sumen capacity. Si hay varios pares, devuelve el de menor primer índice y, si empatan, el de menor segundo índice. Devuelve null si no hay ninguno.",
  "A ferry can take a contiguous line of passengers. Return the largest number of people in a row whose weights sum to at most limit. An empty line returns 0.":
    "Un ferry admite una fila contigua de pasajeros. Devuelve la mayor cantidad de personas seguidas cuyos pesos sumen como máximo limit. Una fila vacía devuelve 0.",
  "The shelf was sorted, then rotated left by an unknown amount. Return the index of call, or -1. Values are unique.":
    "El estante estaba ordenado y luego se rotó a la izquierda una cantidad desconocida. Devuelve el índice de call, o -1. Los valores son únicos.",
  "days holds unique check-in day numbers. Return the length of the longest run of consecutive days. Order in the input does not matter.":
    "days tiene números de día de fichaje, sin repetir. Devuelve la longitud de la racha más larga de días consecutivos. El orden de entrada no importa.",
  "Each window is [start, end), with start < end. Merge overlaps and touching windows. Return the result sorted by start.":
    "Cada ventana es [start, end), con start < end. Une las que se solapan o se tocan. Devuelve el resultado ordenado por el inicio.",
  "A signal is a string of station codes, one character each. Return the length of the longest substring that does not repeat a code.":
    "Una señal es un texto de códigos de estación, un carácter cada uno. Devuelve la longitud de la subcadena más larga que no repita un código.",
  "Cars arrive numbered 1 through n in that order. You may send a car straight to the output or park it on one stack (last in, first out). Return whether target, a permutation of 1..n, can be produced.":
    "Los autos llegan numerados del 1 al n en ese orden. Puedes mandar un auto directo a la salida o dejarlo en una pila (el último en entrar es el primero en salir). Devuelve si se puede producir target, una permutación de 1..n.",
  "Return an array where each position is the product of every other reading. Do not use division. A single reading returns [1].":
    "Devuelve un arreglo donde cada posición sea el producto de todas las demás lecturas. No uses división. Una sola lectura devuelve [1].",
  "For each shift, return the pay of the next strictly higher shift to its right. If none exists, use -1.":
    "Para cada turno, devuelve el pago del siguiente turno estrictamente mayor a su derecha. Si no hay, usa -1.",
  "codes contains only 0, 1, and 2. Return the same values sorted ascending. You may mutate the input.":
    "codes contiene solo 0, 1 y 2. Devuelve los mismos valores ordenados de menor a mayor. Puedes modificar la entrada.",
  "coins are positive denominations you may use any number of times. Return the fewest coins that sum to amount, or -1 if it is impossible. amount 0 returns 0.":
    "coins son denominaciones positivas que puedes usar las veces que quieras. Devuelve la menor cantidad de monedas que sumen amount, o -1 si es imposible. amount 0 devuelve 0.",
  "Group labels that use the same letters with the same counts. Order inside a group follows the input. Order of groups follows the first label in each group.":
    "Agrupa las etiquetas que usan las mismas letras con las mismas cantidades. El orden dentro de un grupo sigue la entrada. El orden de los grupos sigue la primera etiqueta de cada uno.",
  "points are dock coordinates. Return the k closest to (0, 0) by squared distance, ties broken by the earlier input. k is between 1 and the number of points.":
    "points son coordenadas de muelles. Devuelve los k más cercanos a (0, 0) por distancia al cuadrado. Si empatan, gana el que aparece antes. k está entre 1 y la cantidad de puntos.",
  "Each meeting is [start, end). A room frees at end. Return the minimum number of rooms so no two meetings share a room while both are open.":
    "Cada reunión es [start, end). Una sala se libera en end. Devuelve el mínimo de salas para que dos reuniones abiertas a la vez no compartan sala.",
  "A message maps 1..26 to letters. Return how many ways digits can be decoded. A leading zero in a piece is invalid. An empty string returns 0.":
    "Un mensaje asigna 1..26 a letras. Devuelve de cuántas formas se pueden decodificar los dígitos. Un cero a la izquierda de un tramo es inválido. Un texto vacío devuelve 0.",
  "There are modules 0..n-1. Each edge [before, after] means before must precede after. Return any valid order, or null if the graph has a cycle.":
    "Hay módulos 0..n-1. Cada arista [before, after] significa que before debe ir antes que after. Devuelve cualquier orden válido, o null si el grafo tiene un ciclo.",
  "grid holds 1 for a ripe tree and 0 for empty soil. Trees touching on an edge (not a corner) form one plot. Return the number of plots.":
    "grid tiene 1 para un árbol maduro y 0 para suelo vacío. Los árboles que se tocan por un lado (no por una esquina) forman una parcela. Devuelve la cantidad de parcelas.",
  "Walk a rectangular grid clockwise from the top-left and return the cells in that order. An empty grid returns [].":
    "Recorre una cuadrícula rectangular en el sentido del reloj desde la esquina superior izquierda y devuelve las celdas en ese orden. Una cuadrícula vacía devuelve [].",
  "a and b are digits of non-negative integers, most significant digit first, with no leading zero unless the value is 0. Return their sum in the same form.":
    "a y b son dígitos de enteros no negativos, el más significativo primero, sin cero a la izquierda salvo que el valor sea 0. Devuelve su suma en la misma forma.",
  "Return the maximum of every contiguous window of length k. k is between 1 and values.length.":
    "Devuelve el máximo de cada ventana contigua de longitud k. k está entre 1 y values.length.",
  "Look at each window of k characters. Return a string of the first character in that window that appears once inside it. If a window has none, put '.'.":
    "Mira cada ventana de k caracteres. Devuelve un texto con el primer carácter de esa ventana que aparece una sola vez dentro de ella. Si una ventana no tiene ninguno, pon '.'.",
  "prices[i] is the rate on day i. You may buy once and sell once later. Return the largest profit, or 0 if no gain is possible.":
    "prices[i] es la tarifa del día i. Puedes comprar una vez y vender una vez después. Devuelve la mayor ganancia, o 0 si no hay ganancia posible.",
  "You can climb n rungs. On each move you advance by one of the values in steps. Order matters. Return the number of ways. n = 0 returns 1.":
    "Puedes subir n peldaños. En cada movimiento avanzas uno de los valores de steps. El orden importa. Devuelve la cantidad de formas. n = 0 devuelve 1.",
  "Simulate a cache that keeps at most capacity keys and evicts the least recently used key. get returns the value or null. put stores key to value and counts as a use. Return the get results only.":
    "Simula una caché que guarda como máximo capacity claves y expulsa la menos usada recientemente. get devuelve el valor o null. put guarda la clave con el valor y cuenta como un uso. Devuelve solo los resultados de get.",
  "0 is open floor, 1 is a wall. Start at the top-left and stop at the bottom-right. Moving up, down, left, or right costs one minute. Return the fewest minutes, or -1 if the gate is unreachable.":
    "0 es piso libre y 1 es una pared. Empieza arriba a la izquierda y termina abajo a la derecha. Moverte arriba, abajo, izquierda o derecha cuesta un minuto. Devuelve los minutos mínimos, o -1 si la salida no se alcanza.",
  "Return the minimum insertions, deletions, and substitutions that turn a into b. Each edit costs 1.":
    "Devuelve el mínimo de inserciones, borrados y sustituciones que convierten a en b. Cada edición cuesta 1.",
  "heights are bar heights in a row. Water settles in the gaps up to the lower bounding bar. Return how many units of water the row holds.":
    "heights son alturas de barras en una fila. El agua se queda en los huecos hasta la barra que la limita por abajo. Devuelve cuántas unidades de agua retiene la fila.",
  "a and b are sorted ascending. Return the median of the combined multiset. If the count is even, return the average of the two middle values.":
    "a y b están ordenados de menor a mayor. Devuelve la mediana del multiconjunto combinado. Si la cantidad es par, devuelve el promedio de los dos valores centrales.",
  "Return the shortest contiguous slice of log that contains every character in need, with at least the required counts. If several are the same length, return the leftmost. If none exist, return ''.":
    "Devuelve el tramo contiguo más corto de log que contenga cada carácter de need, al menos con las cantidades pedidas. Si hay varios de la misma longitud, devuelve el de más a la izquierda. Si no hay ninguno, devuelve ''.",
  "1 is a free cell and 0 is blocked. Return the area of the largest rectangle of free cells. A single free cell has area 1.":
    "1 es una celda libre y 0 está bloqueada. Devuelve el área del mayor rectángulo de celdas libres. Una sola celda libre tiene área 1.",
  "pattern may contain letters, '.' which matches one character, and '*' which repeats the previous pattern character zero or more times. '*' is never first and never doubled. Return whether the whole text matches.":
    "pattern puede tener letras, '.' que coincide con un carácter, y '*' que repite el carácter anterior del patrón cero o más veces. '*' nunca va primero ni se duplica. Devuelve si todo el texto coincide.",
  "Crates in a line have scores. Bursting crate i earns the product of its neighbors' scores (missing neighbors count as 1) and removes it. Return the best total.":
    "Las cajas en una fila tienen puntuaciones. Reventar la caja i gana el producto de las puntuaciones de sus vecinas (la que falte cuenta como 1) y la quita. Devuelve el mejor total.",
  "Return the fewest cuts that split label into pieces that are each a palindrome. A palindrome needs zero cuts.":
    "Devuelve los cortes mínimos que parten label en trozos que sean palíndromos. Un palíndromo necesita cero cortes.",
  "Return whether woven is an interleaving of a and b that preserves the order of each. Characters are drawn from one string or the other.":
    "Devuelve si woven es un entrelazado de a y b que conserva el orden de cada uno. Los caracteres salen de uno u otro texto.",
  "An undirected network has nodes 0..n-1. Return every edge whose removal increases the number of connected components. List each edge with the smaller node first, and sort the list.":
    "Una red no dirigida tiene nodos 0..n-1. Devuelve cada arista cuya eliminación aumenta la cantidad de componentes conexos. Escribe cada arista con el nodo menor primero y ordena la lista.",
  "Count ways to place n queens on an n by n board so no two share a row, column, or diagonal. Rotations count as different.":
    "Cuenta las formas de colocar n reinas en un tablero de n por n de modo que ninguna comparta fila, columna o diagonal. Las rotaciones cuentan como distintas.",
  "Each envelope is [width, height]. One fits in another only when both width and height are strictly smaller. Return the most envelopes in one nested stack.":
    "Cada sobre es [width, height]. Uno cabe en otro solo si tanto el ancho como el alto son estrictamente menores. Devuelve la mayor cantidad de sobres en una sola pila anidada.",
  "For each index, return how many later values are strictly smaller.":
    "Para cada índice, devuelve cuántos valores posteriores son estrictamente menores.",
  "You may complete as many buy-then-sell trades as you want. After a sale you must skip the next day. Return the best profit.":
    "Puedes completar tantas operaciones de comprar y luego vender como quieras. Después de una venta debes saltarte el día siguiente. Devuelve la mejor ganancia.",
  "0 is open and 1 is an obstacle. You may pass through at most budget obstacles. Return the fewest steps from the top-left to the bottom-right, or -1.":
    "0 está libre y 1 es un obstáculo. Puedes atravesar como máximo budget obstáculos. Devuelve los pasos mínimos de la esquina superior izquierda a la inferior derecha, o -1.",
  "routes[i] is the set of stops one bus visits. You may ride a bus between any of its stops. Return the fewest buses to go from source to target, or -1. Staying put when source equals target returns 0.":
    "routes[i] es el conjunto de paradas que visita un autobús. Puedes viajar en un autobús entre cualquiera de sus paradas. Devuelve la menor cantidad de autobuses para ir de source a target, o -1. Quedarse quieto cuando source es igual a target devuelve 0.",
  "Two pickers start at the top-left and top-right of a grid of non-negative values and both must end on the bottom row. Each move steps down one row and may change column by -1, 0, or 1, staying inside the grid. A cell claimed by both on the same row counts once. Return the best total.":
    "Dos recolectores empiezan en la esquina superior izquierda y la superior derecha de una cuadrícula de valores no negativos, y ambos deben terminar en la fila de abajo. Cada movimiento baja una fila y puede cambiar de columna en -1, 0 o 1, sin salir de la cuadrícula. Una celda tomada por ambos en la misma fila cuenta una vez. Devuelve el mejor total.",
  "Each step changes exactly one character and must land on a word in bank. Return the number of words in the shortest sequence from begin to end, counting both, or 0 if end is unreachable. begin does not have to be in bank.":
    "Cada paso cambia exactamente un carácter y debe caer en una palabra de bank. Devuelve la cantidad de palabras de la secuencia más corta de begin a end, contando ambas, o 0 si end no se alcanza. begin no tiene que estar en bank.",
  "words are sorted in an unknown alphabet. Return any letter order that makes that sort valid, or null if the list contradicts itself. Letters that never appear are omitted.":
    "words está ordenado en un alfabeto desconocido. Devuelve cualquier orden de letras que haga válido ese orden, o null si la lista se contradice. Se omiten las letras que no aparecen.",
  "Return every way to split text into a sequence of words from the dictionary, preserving order. The dictionary has no duplicates. Order the results by the input scan.":
    "Devuelve cada forma de partir text en una secuencia de palabras del diccionario, conservando el orden. El diccionario no tiene duplicados. Ordena los resultados según el recorrido de la entrada.",
  "Move only right or down from the top-left to the bottom-right. Cells may be negative. Return the best path sum.":
    "Muévete solo a la derecha o hacia abajo, de la esquina superior izquierda a la inferior derecha. Las celdas pueden ser negativas. Devuelve la mejor suma del camino.",
  "A person can do one job at a time. Jobs include start and exclude end. Return the maximum profit of a compatible subset.":
    "Una persona puede hacer un trabajo a la vez. Los trabajos incluyen start y excluyen end. Devuelve la ganancia máxima de un subconjunto compatible.",
  "Return every way to insert three dots so the string becomes four decimal parts. Each part is 0 through 255 with no leading zero. Order follows the input.":
    "Devuelve cada forma de insertar tres puntos para que el texto quede en cuatro partes decimales. Cada parte va de 0 a 255 y no tiene cero a la izquierda. El orden sigue la entrada.",
  "expr contains non-negative integers, '+', '-', '*', '/', spaces, and parentheses. '*' and '/' bind tighter than '+' and '-'. Division truncates toward zero. Return the value.":
    "expr contiene enteros no negativos, '+', '-', '*', '/', espacios y paréntesis. '*' y '/' se agrupan antes que '+' y '-'. La división trunca hacia cero. Devuelve el valor.",
  "Each building is [left, right, height], with left < right. Return the skyline as [x, height] points where the running height changes, from left to right.":
    "Cada edificio es [left, right, height], con left < right. Devuelve la silueta como puntos [x, height] donde cambia la altura acumulada, de izquierda a derecha.",
};
