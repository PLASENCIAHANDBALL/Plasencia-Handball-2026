/* ============================================================
   IDIOMAS: español (original), inglés, portugués y francés
   ------------------------------------------------------------
   La app está escrita en español. Este módulo traduce lo que se ve en pantalla:

   - Recorre el texto de la página (y lo que la app vaya pintando después) y sustituye
     las frases conocidas por su traducción. El texto original se guarda, así que se
     puede volver al español o cambiar de idioma sin recargar.
   - Los datos de la base de datos (nombres de clubs, equipos, productos...) no se tocan.

   Para añadir o corregir una traducción: busca la frase en español en TEXTOS y cambia
   el array [inglés, portugués, francés]. Si una frase tiene números o nombres dentro,
   va en PATRONES.
   ============================================================ */

import { DE } from "./i18n-de.js";

const CODIGOS = ["es", "en", "pt", "fr", "de"];
const NOMBRES = { es: "Español", en: "English", pt: "Português", fr: "Français", de: "Deutsch" };
const INDICE = { en: 0, pt: 1, fr: 2, de: 3 };

/* ------------------------- banderas (SVG) ------------------------- */
const BANDERAS = {
  de: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect width="60" height="20" fill="#000"/><rect y="20" width="60" height="20" fill="#dd0000"/><rect y="40" width="60" height="20" fill="#ffce00"/></svg>`,
  es: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect width="60" height="60" fill="#c60b1e"/><rect y="15" width="60" height="30" fill="#ffc400"/></svg>`,
  fr: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect width="20" height="60" fill="#0055a4"/><rect x="20" width="20" height="60" fill="#fff"/><rect x="40" width="20" height="60" fill="#ef4135"/></svg>`,
  pt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect width="60" height="60" fill="#ff0000"/><rect width="24" height="60" fill="#006600"/><circle cx="24" cy="30" r="8" fill="#ffcc00"/><circle cx="24" cy="30" r="5" fill="#fff"/><rect x="21.5" y="26.5" width="5" height="6" rx="1.5" fill="#ff0000"/></svg>`,
  en: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="15 0 30 30" preserveAspectRatio="xMidYMid slice"><clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><g clip-path="url(#s)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#t)" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></g></svg>`
};

function urlBandera(cod) {
  return `url('data:image/svg+xml,${encodeURIComponent(BANDERAS[cod]).replace(/'/g, "%27")}')`;
}

/* ------------------------- diccionario ------------------------- */
// "frase en español": [inglés, portugués, francés]
const TEXTOS = {
  // --- navegación y cabecera ---
  "Inicio": ["Home", "Início", "Accueil"],
  "Partidos": ["Matches", "Jogos", "Matchs"],
  "Categorías": ["Categories", "Categorias", "Catégories"],
  "Clubs": ["Clubs", "Clubes", "Clubs"],
  "Tabla": ["Table", "Tabela", "Tableau"],
  "Pabellones": ["Venues", "Pavilhões", "Gymnases"],
  "Tienda": ["Shop", "Loja", "Boutique"],
  "Cargando…": ["Loading…", "A carregar…", "Chargement…"],
  "Secciones de la app": ["App sections", "Secções da app", "Sections de l'appli"],
  "Acceso de organización": ["Organiser access", "Acesso da organização", "Accès organisation"],
  "Redes sociales": ["Social media", "Redes sociais", "Réseaux sociaux"],
  "Idioma": ["Language", "Idioma", "Langue"],
  "Plasencia Handball · Torneo Internacional de Balonmano": ["Plasencia Handball · International Handball Tournament", "Plasencia Handball · Torneio Internacional de Andebol", "Plasencia Handball · Tournoi international de handball"],
  "Torneo Internacional de Balonmano": ["International Handball Tournament", "Torneio Internacional de Andebol", "Tournoi international de handball"],
  "Torneo Internacional Plasencia Handball": ["Plasencia Handball International Tournament", "Torneio Internacional Plasencia Handball", "Tournoi international Plasencia Handball"],
  "Partidos, resultados en directo, clasificaciones y pabellones del Torneo Internacional Plasencia Handball.": ["Matches, live results, standings and venues of the Plasencia Handball International Tournament.", "Jogos, resultados em direto, classificações e pavilhões do Torneio Internacional Plasencia Handball.", "Matchs, résultats en direct, classements et gymnases du tournoi international Plasencia Handball."],
  "Esta aplicación necesita JavaScript para mostrar los partidos y las clasificaciones.": ["This app needs JavaScript to show the matches and standings.", "Esta aplicação precisa de JavaScript para mostrar os jogos e as classificações.", "Cette application a besoin de JavaScript pour afficher les matchs et les classements."],

  // --- reproductor ---
  "Canción del torneo": ["Tournament song", "Canção do torneio", "Chanson du tournoi"],
  "Suena en Plasencia": ["Playing in Plasencia", "A tocar em Plasencia", "Ça résonne à Plasencia"],
  "Posición de la canción": ["Song position", "Posição da canção", "Position du morceau"],
  "Reproducir canción": ["Play song", "Reproduzir canção", "Lire la chanson"],
  "Pausar canción": ["Pause song", "Pausar canção", "Mettre en pause"],
  "Volver al principio de la canción": ["Back to the start of the song", "Voltar ao início da canção", "Revenir au début du morceau"],
  "Reproductor de la canción del torneo": ["Tournament song player", "Leitor da canção do torneio", "Lecteur de la chanson du tournoi"],

  // --- inicio ---
  "Avisos de partidos": ["Match alerts", "Avisos de jogos", "Alertes de matchs"],
  "Te avisamos antes de que empiece tu equipo": ["We'll alert you before your team starts", "Avisamos-te antes de a tua equipa começar", "Nous vous prévenons avant le début du match de votre équipe"],
  "Fotos del torneo": ["Tournament photos", "Fotos do torneio", "Photos du tournoi"],
  "Ver carpeta de fotos": ["View photo folder", "Ver pasta de fotos", "Voir le dossier photos"],
  "Cargando imágenes…": ["Loading images…", "A carregar imagens…", "Chargement des images…"],
  "Partidos en juego": ["Live matches", "Jogos a decorrer", "Matchs en cours"],
  "En vivo": ["Live", "Ao vivo", "En direct"],
  "En juego": ["In play", "Em jogo", "En cours"],
  "Patrocinadores": ["Sponsors", "Patrocinadores", "Sponsors"],
  "Añadir patrocinador": ["Add sponsor", "Adicionar patrocinador", "Ajouter un sponsor"],
  "Nuevo patrocinador": ["New sponsor", "Novo patrocinador", "Nouveau sponsor"],
  "Subir patrocinador": ["Move sponsor up", "Subir patrocinador", "Monter le sponsor"],
  "Bajar patrocinador": ["Move sponsor down", "Descer patrocinador", "Descendre le sponsor"],
  "Borrar patrocinador": ["Delete sponsor", "Apagar patrocinador", "Supprimer le sponsor"],
  "Ver todos los partidos": ["See all matches", "Ver todos os jogos", "Voir tous les matchs"],
  "Ver menos partidos": ["See fewer matches", "Ver menos jogos", "Voir moins de matchs"],
  "Historia del Torneo": ["Tournament history", "História do Torneio", "Histoire du tournoi"],
  "Nuestra historia comienza gracias a un grupo de amigos y grandes aficionados al balonmano que compartíamos una misma ilusión: crear algo especial para este deporte que tanto nos une.": [
    "Our story begins with a group of friends and great handball fans who shared the same dream: to create something special for the sport that brings us together.",
    "A nossa história começa com um grupo de amigos e grandes apaixonados por andebol que partilhavam o mesmo sonho: criar algo especial para este desporto que tanto nos une.",
    "Notre histoire commence avec un groupe d'amis, grands passionnés de handball, qui partageaient un même rêve : créer quelque chose de spécial pour ce sport qui nous rassemble tant."],
  "De esa pasión nació el": ["From that passion was born the", "Dessa paixão nasceu o", "De cette passion est né le"],
  ", cuya primera edición se celebró en el año": [", whose first edition was held in", ", cuja primeira edição se realizou em", ", dont la première édition a eu lieu en"],
  ". Aquella primera experiencia estuvo marcada por la ilusión, el esfuerzo y las ganas de demostrar que Plasencia podía acoger un torneo de balonmano base con identidad propia.": [
    ". That first experience was marked by enthusiasm, effort and the desire to show that Plasencia could host a youth handball tournament with an identity of its own.",
    ". Essa primeira experiência foi marcada pela ilusão, pelo esforço e pela vontade de demonstrar que Plasencia podia receber um torneio de andebol de formação com identidade própria.",
    ". Cette première expérience fut marquée par l'enthousiasme, l'effort et l'envie de montrer que Plasencia pouvait accueillir un tournoi de handball de jeunes avec sa propre identité."],
  "A lo largo de los años, el torneo ha ido creciendo tanto en participación como en nivel deportivo, reuniendo en Plasencia a equipos nacionales e internacionales y llenando nuestros pabellones de balonmano, ambiente y emoción durante varios días.": [
    "Over the years, the tournament has grown in both participation and sporting level, bringing national and international teams to Plasencia and filling our sports halls with handball, atmosphere and emotion for several days.",
    "Ao longo dos anos, o torneio tem crescido tanto em participação como em nível desportivo, reunindo em Plasencia equipas nacionais e internacionais e enchendo os nossos pavilhões de andebol, ambiente e emoção durante vários dias.",
    "Au fil des ans, le tournoi a grandi, tant par sa participation que par son niveau sportif, réunissant à Plasencia des équipes nationales et internationales et remplissant nos gymnases de handball, d'ambiance et d'émotion pendant plusieurs jours."],
  "Desde entonces, nuestro objetivo ha sido claro: ofrecer a jugadores y jugadoras una experiencia deportiva única, combinando competición, convivencia y valores como el respeto, el compañerismo y el trabajo en equipo.": [
    "Since then, our goal has been clear: to offer players a unique sporting experience, combining competition, togetherness and values such as respect, companionship and teamwork.",
    "Desde então, o nosso objetivo tem sido claro: oferecer aos jogadores e às jogadoras uma experiência desportiva única, combinando competição, convívio e valores como o respeito, o companheirismo e o trabalho em equipa.",
    "Depuis, notre objectif est clair : offrir aux joueurs et aux joueuses une expérience sportive unique, mêlant compétition, convivialité et valeurs telles que le respect, la camaraderie et l'esprit d'équipe."],
  "Cada edición es un nuevo reto y una nueva oportunidad para seguir mejorando, pero siempre manteniendo la esencia con la que empezamos en 2023: la pasión por el balonmano y las ganas de crear recuerdos inolvidables para todos los que forman parte de este torneo.": [
    "Every edition is a new challenge and a new chance to keep improving, always keeping the essence we started with in 2023: a passion for handball and the desire to create unforgettable memories for everyone who is part of this tournament.",
    "Cada edição é um novo desafio e uma nova oportunidade para continuar a melhorar, mas mantendo sempre a essência com que começámos em 2023: a paixão pelo andebol e a vontade de criar memórias inesquecíveis para todos os que fazem parte deste torneio.",
    "Chaque édition est un nouveau défi et une nouvelle occasion de progresser, tout en gardant l'essence avec laquelle nous avons commencé en 2023 : la passion du handball et l'envie de créer des souvenirs inoubliables pour tous ceux qui font partie de ce tournoi."],
  "Esta historia sigue escribiéndose gracias a los clubes, jugadores, entrenadores, familias, patrocinadores y a todas las personas que confían en nosotros y hacen posible que este proyecto siga creciendo año tras año.": [
    "This story continues to be written thanks to the clubs, players, coaches, families, sponsors and everyone who trusts us and makes it possible for this project to keep growing year after year.",
    "Esta história continua a ser escrita graças aos clubes, jogadores, treinadores, famílias, patrocinadores e a todas as pessoas que confiam em nós e tornam possível que este projeto continue a crescer ano após ano.",
    "Cette histoire continue de s'écrire grâce aux clubs, aux joueurs, aux entraîneurs, aux familles, aux sponsors et à toutes les personnes qui nous font confiance et permettent à ce projet de grandir année après année."],

  // --- estados y fases ---
  "Pendiente": ["Upcoming", "Pendente", "À venir"],
  "Finalizado": ["Finished", "Terminado", "Terminé"],
  "Finalizados": ["Finished", "Terminados", "Terminés"],
  "Próximos": ["Upcoming", "Próximos", "À venir"],
  "Próximos partidos": ["Upcoming matches", "Próximos jogos", "Prochains matchs"],
  "Partidos finalizados": ["Finished matches", "Jogos terminados", "Matchs terminés"],
  "Hoy": ["Today", "Hoje", "Aujourd'hui"],
  "Final": ["Final", "Final", "Finale"],
  "Semifinal": ["Semi-final", "Meia-final", "Demi-finale"],
  "Cuartos de final": ["Quarter-finals", "Quartos de final", "Quarts de finale"],
  "Playoff": ["Playoff", "Playoff", "Playoff"],
  "Grupo único": ["Single group", "Grupo único", "Groupe unique"],
  "Grupo Único": ["Single group", "Grupo único", "Groupe unique"],
  "Fecha por confirmar": ["Date to be confirmed", "Data por confirmar", "Date à confirmer"],
  "Por definir": ["To be decided", "Por definir", "À définir"],
  "Sin grupo": ["No group", "Sem grupo", "Sans groupe"],
  "Sin categoría": ["No category", "Sem categoria", "Sans catégorie"],
  "Sin género": ["No gender", "Sem género", "Sans genre"],
  "Masculino": ["Boys", "Masculino", "Masculin"],
  "Femenino": ["Girls", "Feminino", "Féminin"],

  // --- partidos ---
  "Ver partido": ["View match", "Ver jogo", "Voir le match"],
  "Ver partidos": ["View matches", "Ver jogos", "Voir les matchs"],
  "Volver": ["Back", "Voltar", "Retour"],
  "Volver a partidos": ["Back to matches", "Voltar aos jogos", "Retour aux matchs"],
  "Volver a pabellones": ["Back to venues", "Voltar aos pavilhões", "Retour aux gymnases"],
  "Todos los clubs": ["All clubs", "Todos os clubes", "Tous les clubs"],
  "Todos los grupos": ["All groups", "Todos os grupos", "Tous les groupes"],
  "Todos": ["All", "Todos", "Tous"],
  "No hay próximos partidos": ["No upcoming matches", "Não há próximos jogos", "Aucun match à venir"],
  "No hay próximos partidos.": ["No upcoming matches.", "Não há próximos jogos.", "Aucun match à venir."],
  "No hay partidos finalizados": ["No finished matches", "Não há jogos terminados", "Aucun match terminé"],
  "No hay partidos finalizados.": ["No finished matches.", "Não há jogos terminados.", "Aucun match terminé."],
  "No hay partidos": ["No matches", "Não há jogos", "Aucun match"],
  "No hay fases finales creadas aún.": ["No final stages have been created yet.", "Ainda não há fases finais criadas.", "Aucune phase finale n'a encore été créée."],
  "Cuadros eliminatorios": ["Knockout brackets", "Quadros eliminatórios", "Tableaux à élimination directe"],
  "Cuadro eliminatorio": ["Knockout bracket", "Quadro eliminatório", "Tableau à élimination directe"],
  "Partido de fase final": ["Final-stage match", "Jogo da fase final", "Match de phase finale"],
  "Crear partido de fase final": ["Create final-stage match", "Criar jogo da fase final", "Créer un match de phase finale"],
  "Nuevo partido": ["New match", "Novo jogo", "Nouveau match"],
  "Editar partido": ["Edit match", "Editar jogo", "Modifier le match"],
  "Crear partido": ["Create match", "Criar jogo", "Créer le match"],
  "Guardar partido": ["Save match", "Guardar jogo", "Enregistrer le match"],
  "Categoría y grupo": ["Category and group", "Categoria e grupo", "Catégorie et groupe"],
  "Categoría y fase": ["Category and phase", "Categoria e fase", "Catégorie et phase"],
  "Elige la categoría y el grupo, después los equipos y por último cuándo y dónde se juega.": ["Choose the category and group, then the teams, and finally when and where it is played.", "Escolhe a categoria e o grupo, depois as equipas e, por fim, quando e onde se joga.", "Choisissez la catégorie et le groupe, puis les équipes, et enfin quand et où le match se joue."],
  "Elige la categoría y la fase, después los equipos y por último cuándo y dónde se juega.": ["Choose the category and phase, then the teams, and finally when and where it is played.", "Escolhe a categoria e a fase, depois as equipas e, por fim, quando e onde se joga.", "Choisissez la catégorie et la phase, puis les équipes, et enfin quand et où le match se joue."],
  "Equipo local": ["Home team", "Equipa da casa", "Équipe locale"],
  "Equipo visitante": ["Away team", "Equipa visitante", "Équipe visiteuse"],
  "Equipo": ["Team", "Equipa", "Équipe"],
  "Equipos": ["Teams", "Equipas", "Équipes"],
  "Fecha y pabellón": ["Date and venue", "Data e pavilhão", "Date et gymnase"],
  "Datos del partido": ["Match details", "Dados do jogo", "Détails du match"],
  "Guardar datos": ["Save details", "Guardar dados", "Enregistrer les données"],
  "Guardar resultado": ["Save result", "Guardar resultado", "Enregistrer le résultat"],
  "Finalizar partido": ["Finish match", "Terminar jogo", "Terminer le match"],
  "Finalizar cierra el partido y actualiza la clasificación.": ["Finishing closes the match and updates the standings.", "Terminar fecha o jogo e atualiza a classificação.", "Terminer clôture le match et met à jour le classement."],
  "Resultado": ["Result", "Resultado", "Résultat"],
  "Resumen": ["Summary", "Resumo", "Résumé"],
  "Falta la fecha": ["Date missing", "Falta a data", "Date manquante"],
  "Elige los dos equipos": ["Choose both teams", "Escolhe as duas equipas", "Choisissez les deux équipes"],
  "Fase": ["Phase", "Fase", "Phase"],
  "Posición en juego (opcional)": ["Position at stake (optional)", "Posição em disputa (opcional)", "Place en jeu (facultatif)"],
  "Sin posición concreta": ["No specific position", "Sem posição específica", "Aucune place précise"],
  "Categoría": ["Category", "Categoria", "Catégorie"],
  "Género": ["Gender", "Género", "Genre"],
  "Grupo": ["Group", "Grupo", "Groupe"],
  "Fecha": ["Date", "Data", "Date"],
  "Hora": ["Time", "Hora", "Heure"],
  "Lugar": ["Place", "Local", "Lieu"],
  "Pabellón": ["Venue", "Pavilhão", "Gymnase"],
  "Pabellón Municipal": ["Municipal Sports Hall", "Pavilhão Municipal", "Gymnase municipal"],
  "Cancelar": ["Cancel", "Cancelar", "Annuler"],
  "Guardar": ["Save", "Guardar", "Enregistrer"],
  "Guardar cambios": ["Save changes", "Guardar alterações", "Enregistrer les modifications"],
  "Editar": ["Edit", "Editar", "Modifier"],
  "Borrar": ["Delete", "Apagar", "Supprimer"],
  "Eliminar": ["Delete", "Eliminar", "Supprimer"],
  "Ver directo": ["Watch live", "Ver em direto", "Voir en direct"],
  "Ubicación": ["Location", "Localização", "Emplacement"],
  "Web": ["Website", "Website", "Site web"],

  // --- clasificación ---
  "Clasificación": ["Standings", "Classificação", "Classement"],
  "PJ": ["P", "J", "J"],
  "PG": ["W", "V", "G"],
  "PE": ["D", "E", "N"],
  "PP": ["L", "D", "P"],
  "GF": ["GF", "GM", "BP"],
  "GC": ["GA", "GS", "BC"],
  "DG": ["GD", "DG", "Diff"],
  "Pts": ["Pts", "Pts", "Pts"],
  "Partidos jugados": ["Matches played", "Jogos disputados", "Matchs joués"],
  "Partidos ganados": ["Matches won", "Jogos ganhos", "Matchs gagnés"],
  "Partidos empatados": ["Matches drawn", "Jogos empatados", "Matchs nuls"],
  "Partidos perdidos": ["Matches lost", "Jogos perdidos", "Matchs perdus"],
  "Goles a favor": ["Goals for", "Golos marcados", "Buts pour"],
  "Goles en contra": ["Goals against", "Golos sofridos", "Buts contre"],
  "Diferencia de goles": ["Goal difference", "Diferença de golos", "Différence de buts"],
  "PJ jugados · PG ganados · PE empatados · PP perdidos · DG diferencia de goles · Pts puntos": [
    "P played · W won · D drawn · L lost · GD goal difference · Pts points",
    "J jogos · V vitórias · E empates · D derrotas · DG diferença de golos · Pts pontos",
    "J joués · G gagnés · N nuls · P perdus · Diff différence de buts · Pts points"],
  "Todavía no hay clasificación para esta selección.": ["There are no standings for this selection yet.", "Ainda não há classificação para esta seleção.", "Il n'y a pas encore de classement pour cette sélection."],
  "Cargando clasificación…": ["Loading standings…", "A carregar a classificação…", "Chargement du classement…"],
  "No se pudo cargar la clasificación. Comprueba tu conexión.": ["Could not load the standings. Check your connection.", "Não foi possível carregar a classificação. Verifica a tua ligação.", "Impossible de charger le classement. Vérifiez votre connexion."],

  // --- categorías, clubs, pabellones ---
  "Clubs Participantes": ["Participating clubs", "Clubes participantes", "Clubs participants"],
  "Club": ["Club", "Clube", "Club"],
  "Buscar club": ["Search club", "Procurar clube", "Rechercher un club"],
  "Buscar club o equipo": ["Search club or team", "Procurar clube ou equipa", "Rechercher un club ou une équipe"],
  "No hay clubs que coincidan.": ["No clubs match.", "Nenhum clube corresponde.", "Aucun club ne correspond."],
  "No hay equipos que coincidan.": ["No teams match.", "Nenhuma equipa corresponde.", "Aucune équipe ne correspond."],
  "No hay clubes creados": ["No clubs created", "Não há clubes criados", "Aucun club créé"],
  "No hay equipos en esta categoría": ["No teams in this category", "Não há equipas nesta categoria", "Aucune équipe dans cette catégorie"],
  "No hay equipos en este club": ["No teams in this club", "Não há equipas neste clube", "Aucune équipe dans ce club"],
  "Aún no hay categorías.": ["There are no categories yet.", "Ainda não há categorias.", "Il n'y a pas encore de catégories."],
  "Añadir club": ["Add club", "Adicionar clube", "Ajouter un club"],
  "Añadir equipo": ["Add team", "Adicionar equipa", "Ajouter une équipe"],
  "Nuevo club": ["New club", "Novo clube", "Nouveau club"],
  "Nuevo equipo": ["New team", "Nova equipa", "Nouvelle équipe"],
  "Editar club": ["Edit club", "Editar clube", "Modifier le club"],
  "Editar equipo": ["Edit team", "Editar equipa", "Modifier l'équipe"],
  "Guardar equipo": ["Save team", "Guardar equipa", "Enregistrer l'équipe"],
  "Nombre": ["Name", "Nome", "Nom"],
  "Nombre del club": ["Club name", "Nome do clube", "Nom du club"],
  "Nombre del equipo (opcional)": ["Team name (optional)", "Nome da equipa (opcional)", "Nom de l'équipe (facultatif)"],
  "Ej: BM Plasencia Infantil": ["E.g. BM Plasencia Infantil", "Ex.: BM Plasencia Infantil", "Ex. : BM Plasencia Infantil"],
  "Escudo": ["Crest", "Brasão", "Écusson"],
  "Logo": ["Logo", "Logótipo", "Logo"],
  "Foto": ["Photo", "Foto", "Photo"],
  "Instagram": ["Instagram", "Instagram", "Instagram"],
  "Primero debes crear un club": ["You must create a club first", "Primeiro tens de criar um clube", "Vous devez d'abord créer un club"],

  // --- tienda ---
  "Tienda del torneo": ["Tournament shop", "Loja do torneio", "Boutique du tournoi"],
  "Productos oficiales a la venta en el": ["Official products on sale at the", "Produtos oficiais à venda no", "Produits officiels en vente au"],
  "durante el torneo.": ["during the tournament.", "durante o torneio.", "pendant le tournoi."],
  "Agotado": ["Sold out", "Esgotado", "Épuisé"],
  "Muy pronto": ["Coming soon", "Em breve", "Bientôt"],
  "Aquí verás los productos del torneo.": ["You'll see the tournament products here.", "Aqui verás os produtos do torneio.", "Vous verrez ici les produits du tournoi."],
  "Cargando productos…": ["Loading products…", "A carregar produtos…", "Chargement des produits…"],
  "Añadir producto": ["Add product", "Adicionar produto", "Ajouter un produit"],
  "Nuevo producto": ["New product", "Novo produto", "Nouveau produit"],
  "Editar producto": ["Edit product", "Editar produto", "Modifier le produit"],
  "Descripción (opcional)": ["Description (optional)", "Descrição (opcional)", "Description (facultatif)"],
  "Precio (€)": ["Price (€)", "Preço (€)", "Prix (€)"],
  "Disponible (desmarca si se agota)": ["Available (untick if sold out)", "Disponível (desmarca se esgotar)", "Disponible (décochez si épuisé)"],
  "No se han podido cargar los productos. Comprueba tu conexión e inténtalo de nuevo.": ["Could not load the products. Check your connection and try again.", "Não foi possível carregar os produtos. Verifica a tua ligação e tenta novamente.", "Impossible de charger les produits. Vérifiez votre connexion et réessayez."],

  // --- avisos / notificaciones ---
  "Recibe una notificación en el móvil unos 15 minutos antes de que empiece un partido de los equipos o categorías que elijas.": ["Get a notification on your phone about 15 minutes before a match starts for the teams or categories you choose.", "Recebe uma notificação no telemóvel cerca de 15 minutos antes de começar um jogo das equipas ou categorias que escolheres.", "Recevez une notification sur votre mobile environ 15 minutes avant le début d'un match des équipes ou catégories que vous choisissez."],
  "Recibir avisos": ["Receive alerts", "Receber avisos", "Recevoir des alertes"],
  "Activados · elige equipos o categorías": ["On · choose teams or categories", "Ativados · escolhe equipas ou categorias", "Activées · choisissez des équipes ou catégories"],
  "Enviarme un aviso de prueba": ["Send me a test alert", "Enviar-me um aviso de teste", "M'envoyer une alerte de test"],
  "Aviso de prueba": ["Test alert", "Aviso de teste", "Alerte de test"],
  "Así verás los avisos de los partidos que van a empezar.": ["This is how you'll see alerts for matches that are about to start.", "É assim que verás os avisos dos jogos que vão começar.", "Voici comment vous verrez les alertes des matchs sur le point de commencer."],
  "Cambios guardados": ["Changes saved", "Alterações guardadas", "Modifications enregistrées"],
  "Las notificaciones están bloqueadas para esta web. Actívalas en los ajustes del navegador y vuelve aquí.": ["Notifications are blocked for this site. Turn them on in your browser settings and come back here.", "As notificações estão bloqueadas para este site. Ativa-as nas definições do navegador e volta aqui.", "Les notifications sont bloquées pour ce site. Activez-les dans les paramètres du navigateur et revenez ici."],
  "Las notificaciones están bloqueadas. Actívalas en los ajustes del navegador para esta web.": ["Notifications are blocked. Turn them on in your browser settings for this site.", "As notificações estão bloqueadas. Ativa-as nas definições do navegador para este site.", "Les notifications sont bloquées. Activez-les dans les paramètres du navigateur pour ce site."],
  "Este navegador no admite notificaciones. Prueba con Chrome, Edge, Firefox o Safari actualizado.": ["This browser does not support notifications. Try an up-to-date Chrome, Edge, Firefox or Safari.", "Este navegador não suporta notificações. Experimenta o Chrome, Edge, Firefox ou Safari atualizado.", "Ce navigateur ne prend pas en charge les notifications. Essayez Chrome, Edge, Firefox ou Safari à jour."],
  "En iPhone y iPad los avisos solo funcionan con la app instalada. Pulsa": ["On iPhone and iPad, alerts only work with the app installed. Tap", "No iPhone e no iPad, os avisos só funcionam com a app instalada. Toca em", "Sur iPhone et iPad, les alertes ne fonctionnent qu'avec l'appli installée. Appuyez sur"],
  "Compartir": ["Share", "Partilhar", "Partager"],
  ", elige": [", choose", ", escolhe", ", choisissez"],
  "«Añadir a pantalla de inicio»": ["“Add to Home Screen”", "«Adicionar ao ecrã principal»", "« Sur l'écran d'accueil »"],
  "y vuelve a abrir esta pantalla desde allí.": ["and open this screen again from there.", "e abre este ecrã novamente a partir daí.", "et rouvrez cet écran depuis là."],
  "Instala la app": ["Install the app", "Instala a app", "Installez l'appli"],
  "Instalar": ["Install", "Instalar", "Installer"],
  "Ahora no": ["Not now", "Agora não", "Pas maintenant"],
  "Entendido": ["Got it", "Entendido", "Compris"],
  "Pulsa": ["Tap", "Toca em", "Appuyez sur"],
  "y luego": ["then", "e depois", "puis"],
  "Ábrela desde tu pantalla de inicio y consulta los partidos aunque falle la cobertura.": ["Open it from your home screen and check the matches even with poor signal.", "Abre-a a partir do ecrã principal e consulta os jogos mesmo com pouca cobertura.", "Ouvrez-la depuis votre écran d'accueil et consultez les matchs même sans bon réseau."],
  "Hay una versión nueva de la app.": ["There is a new version of the app.", "Há uma nova versão da app.", "Une nouvelle version de l'appli est disponible."],
  "Actualizar": ["Update", "Atualizar", "Mettre à jour"],
  "Reintentar": ["Try again", "Tentar novamente", "Réessayer"],
  "No se han podido cargar los datos": ["Could not load the data", "Não foi possível carregar os dados", "Impossible de charger les données"],
  "Comprueba tu conexión a internet e inténtalo de nuevo.": ["Check your internet connection and try again.", "Verifica a tua ligação à internet e tenta novamente.", "Vérifiez votre connexion internet et réessayez."],
  "Cargando datos…": ["Loading data…", "A carregar dados…", "Chargement des données…"],

  // --- mensajes (avisos emergentes, confirmaciones) ---
  "Algo no ha ido bien. Si la pantalla no responde, vuelve a abrir la app.": ["Something went wrong. If the screen doesn't respond, reopen the app.", "Algo correu mal. Se o ecrã não responder, volta a abrir a app.", "Un problème est survenu. Si l'écran ne répond pas, rouvrez l'appli."],
  "No se pudo reproducir la canción.": ["The song could not be played.", "Não foi possível reproduzir a canção.", "Impossible de lire la chanson."],
  "Error creando partido": ["Error creating the match", "Erro ao criar o jogo", "Erreur lors de la création du match"],
  "El equipo local y visitante no pueden ser el mismo": ["The home and away teams cannot be the same", "A equipa da casa e a visitante não podem ser a mesma", "L'équipe locale et l'équipe visiteuse ne peuvent pas être les mêmes"],
  "El equipo local y el visitante no pueden ser el mismo.": ["The home and away teams cannot be the same.", "A equipa da casa e a visitante não podem ser a mesma.", "L'équipe locale et l'équipe visiteuse ne peuvent pas être les mêmes."],
  "Elige la fecha del partido.": ["Choose the match date.", "Escolhe a data do jogo.", "Choisissez la date du match."],
  "Elige la hora del partido.": ["Choose the match time.", "Escolhe a hora do jogo.", "Choisissez l'heure du match."],
  "No hay equipos para esa selección: cambia la categoría, el género o el grupo.": ["There are no teams for that selection: change the category, gender or group.", "Não há equipas para essa seleção: muda a categoria, o género ou o grupo.", "Aucune équipe pour cette sélection : changez la catégorie, le genre ou le groupe."],
  "Error guardando cambios": ["Error saving changes", "Erro ao guardar as alterações", "Erreur lors de l'enregistrement"],
  "No se pudo actualizar la clasificación (sin conexión). Vuelve a intentarlo.": ["Could not update the standings (offline). Try again.", "Não foi possível atualizar a classificação (sem ligação). Tenta novamente.", "Impossible de mettre à jour le classement (hors ligne). Réessayez."],
  "¿Finalizar este partido?": ["Finish this match?", "Terminar este jogo?", "Terminer ce match ?"],
  "Los goles deben ser números enteros de 0 o más": ["Goals must be whole numbers, 0 or more", "Os golos têm de ser números inteiros, 0 ou mais", "Les buts doivent être des nombres entiers, 0 ou plus"],
  "Los goles deben ser números enteros": ["Goals must be whole numbers", "Os golos têm de ser números inteiros", "Les buts doivent être des nombres entiers"],
  "Los goles no pueden ser negativos": ["Goals cannot be negative", "Os golos não podem ser negativos", "Les buts ne peuvent pas être négatifs"],
  "Error finalizando partido": ["Error finishing the match", "Erro ao terminar o jogo", "Erreur lors de la clôture du match"],
  "Partido finalizado": ["Match finished", "Jogo terminado", "Match terminé"],
  "Error guardando los datos del partido": ["Error saving the match details", "Erro ao guardar os dados do jogo", "Erreur lors de l'enregistrement des données du match"],
  "Datos guardados": ["Details saved", "Dados guardados", "Données enregistrées"],
  "¿Eliminar este partido definitivamente?": ["Delete this match permanently?", "Eliminar este jogo definitivamente?", "Supprimer définitivement ce match ?"],
  "No hay inputs de resultado disponibles": ["No result fields available", "Não há campos de resultado disponíveis", "Aucun champ de résultat disponible"],
  "Error guardando resultado": ["Error saving the result", "Erro ao guardar o resultado", "Erreur lors de l'enregistrement du résultat"],
  "Resultado guardado": ["Result saved", "Resultado guardado", "Résultat enregistré"],
  "Sesión cerrada": ["Signed out", "Sessão terminada", "Session fermée"],
  "Introduce PIN:": ["Enter PIN:", "Introduz o PIN:", "Saisissez le code PIN :"],
  "PIN incorrecto": ["Incorrect PIN", "PIN incorreto", "Code PIN incorrect"],
  "Nombre y logo son obligatorios": ["Name and logo are required", "O nome e o logótipo são obrigatórios", "Le nom et le logo sont obligatoires"],
  "Error subiendo imagen": ["Error uploading the image", "Erro ao enviar a imagem", "Erreur lors de l'envoi de l'image"],
  "Error guardando patrocinador": ["Error saving the sponsor", "Erro ao guardar o patrocinador", "Erreur lors de l'enregistrement du sponsor"],
  "¿Eliminar este patrocinador?": ["Delete this sponsor?", "Eliminar este patrocinador?", "Supprimer ce sponsor ?"],
  "Error obteniendo patrocinador": ["Error getting the sponsor", "Erro ao obter o patrocinador", "Erreur lors de la récupération du sponsor"],
  "Error borrando patrocinador": ["Error deleting the sponsor", "Erro ao apagar o patrocinador", "Erreur lors de la suppression du sponsor"],
  "Error creando equipo": ["Error creating the team", "Erro ao criar a equipa", "Erreur lors de la création de l'équipe"],
  "Error editando equipo": ["Error editing the team", "Erro ao editar a equipa", "Erreur lors de la modification de l'équipe"],
  "Error borrando equipo": ["Error deleting the team", "Erro ao apagar a equipa", "Erreur lors de la suppression de l'équipe"],
  "Error borrando partido": ["Error deleting the match", "Erro ao apagar o jogo", "Erreur lors de la suppression du match"],
  "Error guardando partido": ["Error saving the match", "Erro ao guardar o jogo", "Erreur lors de l'enregistrement du match"],
  "¿Eliminar este equipo?": ["Delete this team?", "Eliminar esta equipa?", "Supprimer cette équipe ?"],
  "Error actualizando la clasificación": ["Error updating the standings", "Erro ao atualizar a classificação", "Erreur lors de la mise à jour du classement"],
  "Error guardando la clasificación": ["Error saving the standings", "Erro ao guardar a classificação", "Erreur lors de l'enregistrement du classement"],
  "Nombre y escudo son obligatorios": ["Name and crest are required", "O nome e o brasão são obrigatórios", "Le nom et l'écusson sont obligatoires"],
  "Error leyendo la imagen del escudo": ["Error reading the crest image", "Erro ao ler a imagem do brasão", "Erreur lors de la lecture de l'image de l'écusson"],
  "Error guardando club": ["Error saving the club", "Erro ao guardar o clube", "Erreur lors de l'enregistrement du club"],
  "Error al editar club": ["Error editing the club", "Erro ao editar o clube", "Erreur lors de la modification du club"],
  "Introduce el PIN de administrador para guardar los cambios:": ["Enter the administrator PIN to save the changes:", "Introduz o PIN de administrador para guardar as alterações:", "Saisissez le code PIN administrateur pour enregistrer les modifications :"],
  "Escribe el nombre del producto": ["Enter the product name", "Escreve o nome do produto", "Saisissez le nom du produit"],
  "Escribe un precio válido": ["Enter a valid price", "Escreve um preço válido", "Saisissez un prix valide"],
  "Elige una foto del producto": ["Choose a photo of the product", "Escolhe uma foto do produto", "Choisissez une photo du produit"],
  "Producto añadido": ["Product added", "Produto adicionado", "Produit ajouté"],
  "Producto actualizado": ["Product updated", "Produto atualizado", "Produit mis à jour"],
  "Producto eliminado": ["Product deleted", "Produto eliminado", "Produit supprimé"],
  "PIN de administrador no válido": ["Invalid administrator PIN", "PIN de administrador inválido", "Code PIN administrateur invalide"],
  "No se ha podido guardar el cambio": ["The change could not be saved", "Não foi possível guardar a alteração", "Impossible d'enregistrer la modification"],
  "Imagen no válida": ["Invalid image", "Imagem inválida", "Image non valide"],
  "No se pudo procesar la imagen": ["The image could not be processed", "Não foi possível processar a imagem", "Impossible de traiter l'image"],
  "Sin permiso no podemos enviarte avisos.": ["Without permission we can't send you alerts.", "Sem permissão não te podemos enviar avisos.", "Sans autorisation, nous ne pouvons pas vous envoyer d'alertes."],
  "Avisos activados": ["Alerts on", "Avisos ativados", "Alertes activées"],
  "Avisos desactivados": ["Alerts off", "Avisos desativados", "Alertes désactivées"],
  "No se han podido activar los avisos. Inténtalo de nuevo.": ["Alerts could not be turned on. Try again.", "Não foi possível ativar os avisos. Tenta novamente.", "Impossible d'activer les alertes. Réessayez."],
  "No se ha podido mostrar la notificación de prueba.": ["The test notification could not be shown.", "Não foi possível mostrar a notificação de teste.", "Impossible d'afficher la notification de test."],
  "Goles, paradas y jugadas subidos por jugadores y entrenadores. ¡Valora tus favoritos con estrellas!": ["Goals, saves and plays uploaded by players and coaches. Rate your favourites with stars!", "Golos, defesas e jogadas enviados por jogadores e treinadores. Avalia os teus favoritos com estrelas!", "Buts, arrêts et actions mis en ligne par des joueurs et des entraîneurs. Notez vos préférés avec des étoiles !"],
  "Subir mi momento": ["Upload my moment", "Enviar o meu momento", "Publier mon moment"],
  "Goles": ["Goals", "Golos", "Buts"],
  "Defensas": ["Defence", "Defesas", "Défenses"],
  "Paradas": ["Saves", "Defesas do guarda-redes", "Arrêts"],
  "Penaltis": ["Penalties", "Penáltis", "Penalties"],
  "Jugadas": ["Plays", "Jogadas", "Actions"],
  "Momentos": ["Moments", "Momentos", "Moments"],
  "Gol": ["Goal", "Golo", "But"],
  "Defensa": ["Defence", "Defesa", "Défense"],
  "Parada": ["Save", "Defesa", "Arrêt"],
  "Penalti": ["Penalty", "Penálti", "Penalty"],
  "Jugada": ["Play", "Jogada", "Action"],
  "Momento": ["Moment", "Momento", "Moment"],
  "Mejor valorados": ["Top rated", "Mais bem avaliados", "Mieux notés"],
  "Más recientes": ["Most recent", "Mais recentes", "Plus récents"],
  "Tipo de momento": ["Type of moment", "Tipo de momento", "Type de moment"],
  "Orden": ["Order", "Ordem", "Tri"],
  "Destacado": ["Featured", "Destaque", "À la une"],
  "Valora este momento": ["Rate this moment", "Avalia este momento", "Notez ce moment"],
  "Reportar vídeo": ["Report video", "Reportar vídeo", "Signaler la vidéo"],
  "¿Reportar este vídeo?": ["Report this video?", "Reportar este vídeo?", "Signaler cette vidéo ?"],
  "Sin valoraciones": ["No ratings yet", "Sem avaliações", "Aucune note"],
  "Ver más vídeos": ["See more videos", "Ver mais vídeos", "Voir plus de vidéos"],
  "Todavía no hay vídeos": ["There are no videos yet", "Ainda não há vídeos", "Il n'y a pas encore de vidéos"],
  "Sé el primero en subir un momento del torneo.": ["Be the first to upload a moment from the tournament.", "Sê o primeiro a enviar um momento do torneio.", "Soyez le premier à publier un moment du tournoi."],
  "No hay vídeos de este tipo todavía": ["There are no videos of this type yet", "Ainda não há vídeos deste tipo", "Il n'y a pas encore de vidéos de ce type"],
  "Cargando vídeos…": ["Loading videos…", "A carregar vídeos…", "Chargement des vidéos…"],
  "No se han podido cargar los vídeos. Comprueba tu conexión e inténtalo de nuevo.": ["Could not load the videos. Check your connection and try again.", "Não foi possível carregar os vídeos. Verifica a tua ligação e tenta novamente.", "Impossible de charger les vidéos. Vérifiez votre connexion et réessayez."],
  "Pendientes de revisión": ["Pending review", "Pendentes de revisão", "En attente de validation"],
  "Aprobar": ["Approve", "Aprovar", "Approuver"],
  "Subir un momento": ["Upload a moment", "Enviar um momento", "Publier un moment"],
  "Seleccionar vídeo": ["Select video", "Selecionar vídeo", "Choisir une vidéo"],
  "MP4 o MOV · máximo 50 MB · 5-30 segundos recomendados": ["MP4 or MOV · max 50 MB · 5-30 seconds recommended", "MP4 ou MOV · máximo 50 MB · 5-30 segundos recomendados", "MP4 ou MOV · 50 Mo maximum · 5 à 30 secondes recommandées"],
  "Club (opcional)": ["Club (optional)", "Clube (opcional)", "Club (facultatif)"],
  "Sin indicar": ["Not specified", "Sem indicar", "Non précisé"],
  "Descripción corta": ["Short description", "Descrição curta", "Courte description"],
  "Ej.: ¡Paradón a falta de cinco segundos!": ["E.g. A huge save with five seconds left!", "Ex.: Grande defesa a cinco segundos do fim!", "Ex. : Arrêt incroyable à cinq secondes de la fin !"],
  "Confirmo que tengo permiso de las personas que aparecen (o de sus familias o tutores) para compartir este vídeo.": ["I confirm that I have permission from the people who appear (or from their families or guardians) to share this video.", "Confirmo que tenho autorização das pessoas que aparecem (ou das suas famílias ou tutores) para partilhar este vídeo.", "Je confirme avoir l'autorisation des personnes qui apparaissent (ou de leurs familles ou tuteurs) de partager cette vidéo."],
  "Los vídeos se revisarán antes de publicarse.": ["Videos are reviewed before they are published.", "Os vídeos são revistos antes de serem publicados.", "Les vidéos sont vérifiées avant d'être publiées."],
  "Enviar vídeo para revisión": ["Send video for review", "Enviar vídeo para revisão", "Envoyer la vidéo pour validation"],
  "Enviando…": ["Sending…", "A enviar…", "Envoi…"],
  "Elige un vídeo": ["Choose a video", "Escolhe um vídeo", "Choisissez une vidéo"],
  "Formato de vídeo no admitido": ["Video format not supported", "Formato de vídeo não suportado", "Format de vidéo non pris en charge"],
  "El vídeo pesa más de 50 MB": ["The video is larger than 50 MB", "O vídeo tem mais de 50 MB", "La vidéo dépasse 50 Mo"],
  "Escribe una descripción": ["Write a description", "Escreve uma descrição", "Écrivez une description"],
  "Confirma el permiso de imagen": ["Confirm the image permission", "Confirma a autorização de imagem", "Confirmez l'autorisation de droit à l'image"],
  "El vídeo dura demasiado (máximo 60 segundos)": ["The video is too long (maximum 60 seconds)", "O vídeo é demasiado longo (máximo 60 segundos)", "La vidéo est trop longue (60 secondes maximum)"],
  "¡Gracias! Tu vídeo se publicará cuando lo revise la organización.": ["Thank you! Your video will be published once the organisers have reviewed it.", "Obrigado! O teu vídeo será publicado depois de revisto pela organização.", "Merci ! Votre vidéo sera publiée une fois validée par l'organisation."],
  "No se ha podido subir el vídeo": ["The video could not be uploaded", "Não foi possível enviar o vídeo", "Impossible d'envoyer la vidéo"],
  "Has llegado al máximo de vídeos por hoy": ["You have reached today's video limit", "Atingiste o máximo de vídeos por hoje", "Vous avez atteint le maximum de vidéos pour aujourd'hui"],
  "Valoración guardada": ["Rating saved", "Avaliação guardada", "Note enregistrée"],
  "No puedes valorar tu propio vídeo": ["You can't rate your own video", "Não podes avaliar o teu próprio vídeo", "Vous ne pouvez pas noter votre propre vidéo"],
  "No se ha podido guardar la valoración": ["The rating could not be saved", "Não foi possível guardar a avaliação", "Impossible d'enregistrer la note"],
  "No se ha podido enviar el aviso": ["The report could not be sent", "Não foi possível enviar o aviso", "Impossible d'envoyer le signalement"],
  "Gracias por avisar. Lo revisaremos.": ["Thanks for letting us know. We'll review it.", "Obrigado por avisar. Vamos rever.", "Merci pour le signalement. Nous allons vérifier."],
  "Vídeo aprobado": ["Video approved", "Vídeo aprovado", "Vidéo approuvée"],
  "Vídeo eliminado": ["Video deleted", "Vídeo eliminado", "Vidéo supprimée"],
  "¿Eliminar este vídeo?": ["Delete this video?", "Eliminar este vídeo?", "Supprimer cette vidéo ?"],
  "Más opciones": ["More options", "Mais opções", "Plus d'options"],
  "Cerrar menú": ["Close menu", "Fechar menu", "Fermer le menu"],
  "Zona Fan": ["Fan Zone", "Zona Fan", "Zone Fan"],
  "Porra": ["Predictor", "Bolão", "Pronos"],
  "PH Porra": ["PH Predictor", "PH Bolão", "PH Pronos"],
  "Pronosticar": ["Predict", "Palpitar", "Pronostiquer"],
  "Reglas": ["Rules", "Regras", "Règles"],
  "Gestionar": ["Manage", "Gerir", "Gérer"],
  "¿Serás el mejor pronosticador del torneo? Adivina los resultados y sube en la clasificación.": ["Will you be the tournament's best predictor? Guess the results and climb the ranking.", "Serás o melhor palpiteiro do torneio? Adivinha os resultados e sobe na classificação.", "Serez-vous le meilleur pronostiqueur du tournoi ? Devinez les résultats et grimpez au classement."],
  "Elige tu alias": ["Choose your alias", "Escolhe o teu alias", "Choisissez votre pseudo"],
  "Será tu nombre en la clasificación. Usa un apodo, no tu nombre completo.": ["This will be your name in the ranking. Use a nickname, not your full name.", "Será o teu nome na classificação. Usa um apelido, não o teu nome completo.", "Ce sera votre nom dans le classement. Utilisez un surnom, pas votre nom complet."],
  "Ej.: HandballFan": ["E.g.: HandballFan", "Ex.: HandballFan", "Ex. : HandballFan"],
  "Entrar": ["Join", "Entrar", "Entrer"],
  "Jugando como": ["Playing as", "A jogar como", "Vous jouez en tant que"],
  "Cambiar": ["Change", "Mudar", "Changer"],
  "Ese alias ya está en uso": ["That alias is already taken", "Esse alias já está em uso", "Ce pseudo est déjà utilisé"],
  "Usa de 3 a 16 letras, números o _": ["Use 3 to 16 letters, numbers or _", "Usa de 3 a 16 letras, números ou _", "Utilisez 3 à 16 lettres, chiffres ou _"],
  "Los pronósticos de este partido ya están cerrados": ["Predictions for this match are now closed", "Os palpites deste jogo já estão fechados", "Les pronostics de ce match sont clos"],
  "No se ha podido guardar el pronóstico": ["The prediction could not be saved", "Não foi possível guardar o palpite", "Le pronostic n'a pas pu être enregistré"],
  "¡Listo! Ya puedes pronosticar": ["All set! You can predict now", "Pronto! Já podes palpitar", "C'est prêt ! Vous pouvez pronostiquer"],
  "Pronóstico guardado": ["Prediction saved", "Palpite guardado", "Pronostic enregistré"],
  "Escribe tu nuevo alias:": ["Enter your new alias:", "Escreve o teu novo alias:", "Saisissez votre nouveau pseudo :"],
  "¿Cuál crees que será el resultado final?": ["What do you think the final score will be?", "Qual achas que será o resultado final?", "Quel sera selon vous le score final ?"],
  "Guardar mi pronóstico": ["Save my prediction", "Guardar o meu palpite", "Enregistrer mon pronostic"],
  "Actualizar mi pronóstico": ["Update my prediction", "Atualizar o meu palpite", "Mettre à jour mon pronostic"],
  "Elige un alias para poder pronosticar.": ["Choose an alias to start predicting.", "Escolhe um alias para poderes palpitar.", "Choisissez un pseudo pour pronostiquer."],
  "Quitar un gol": ["Remove a goal", "Tirar um golo", "Retirer un but"],
  "Añadir un gol": ["Add a goal", "Juntar um golo", "Ajouter un but"],
  "Resultado:": ["Result:", "Resultado:", "Résultat :"],
  "Pronósticos cerrados": ["Predictions closed", "Palpites fechados", "Pronostics clos"],
  "Tu pronóstico:": ["Your prediction:", "O teu palpite:", "Votre pronostic :"],
  "No pronosticaste este partido": ["You didn't predict this match", "Não palpitaste este jogo", "Vous n'avez pas pronostiqué ce match"],
  "Tendencia de los pronósticos": ["Prediction trend", "Tendência dos palpites", "Tendance des pronostics"],
  "Todavía no hay partidos en la porra": ["There are no matches in the predictor yet", "Ainda não há jogos no bolão", "Aucun match dans les pronos pour l'instant"],
  "La organización irá añadiendo partidos para pronosticar.": ["The organisers will add matches to predict.", "A organização irá adicionando jogos para palpitar.", "L'organisation ajoutera des matchs à pronostiquer."],
  "Pronósticos abiertos": ["Open predictions", "Palpites abertos", "Pronostics ouverts"],
  "Cerrados": ["Closed", "Fechados", "Clos"],
  "La clasificación aparecerá cuando termine el primer partido": ["The ranking will appear when the first match ends", "A classificação aparecerá quando terminar o primeiro jogo", "Le classement apparaîtra à la fin du premier match"],
  "Ocultar jugador": ["Hide player", "Ocultar jogador", "Masquer le joueur"],
  "Sistema de puntuación": ["Scoring system", "Sistema de pontuação", "Système de points"],
  "Resultado exacto (ej. 25-23)": ["Exact score (e.g. 25-23)", "Resultado exato (ex. 25-23)", "Score exact (ex. 25-23)"],
  "Ganador correcto y diferencia exacta de goles": ["Correct winner and exact goal difference", "Vencedor correto e diferença exata de golos", "Bon vainqueur et écart de buts exact"],
  "Empate acertado, sin marcador exacto": ["Draw predicted, without the exact score", "Empate acertado, sem resultado exato", "Match nul trouvé, sans le score exact"],
  "Ganador correcto, sin acertar diferencia": ["Correct winner, wrong difference", "Vencedor correto, sem acertar a diferença", "Bon vainqueur, écart incorrect"],
  "Pronóstico incorrecto": ["Wrong prediction", "Palpite errado", "Pronostic incorrect"],
  "Los puntos no se acumulan por varios criterios: se aplica únicamente la puntuación más alta que corresponda.": ["Points are not added up across criteria: only the highest applicable score counts.", "Os pontos não se acumulam por vários critérios: aplica-se apenas a pontuação mais alta.", "Les points ne se cumulent pas : seul le barème le plus élevé s'applique."],
  "Participación gratuita, sin apuestas ni premios en dinero.": ["Free to play, no betting and no cash prizes.", "Participação gratuita, sem apostas nem prémios em dinheiro.", "Participation gratuite, sans paris ni prix en argent."],
  "Un pronóstico por persona y partido, que puedes cambiar hasta que empiece.": ["One prediction per person and match, which you can change until kick-off.", "Um palpite por pessoa e jogo, que podes alterar até ao início.", "Un pronostic par personne et par match, modifiable jusqu'au coup d'envoi."],
  "Cuenta el resultado final del partido.": ["The final result of the match counts.", "Conta o resultado final do jogo.", "Le résultat final du match compte."],
  "La clasificación es pública y solo muestra alias: no uses tu nombre completo.": ["The ranking is public and only shows aliases: don't use your full name.", "A classificação é pública e só mostra alias: não uses o teu nome completo.", "Le classement est public et n'affiche que des pseudos : n'utilisez pas votre nom complet."],
  "En caso de empate a puntos gana quien tenga más resultados exactos.": ["In case of a tie on points, whoever has more exact scores wins.", "Em caso de empate em pontos, ganha quem tiver mais resultados exatos.", "En cas d'égalité de points, celui qui a le plus de scores exacts l'emporte."],
  "Marca los partidos que entran en la porra. Los pronósticos se cierran solos cuando empieza cada partido.": ["Select the matches included in the predictor. Predictions close automatically when each match starts.", "Marca os jogos que entram no bolão. Os palpites fecham sozinhos quando cada jogo começa.", "Cochez les matchs inclus. Les pronostics se ferment automatiquement au début de chaque match."],
  "No hay partidos pendientes.": ["There are no pending matches.", "Não há jogos pendentes.", "Aucun match en attente."],
  "exacto": ["exact", "exato", "exact"],
};

/* ------------------------- patrones (frases con datos) ------------------------- */
const SEMANA = {
  es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  pt: ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"],
  de: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]
};
const MESES = {
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  pt: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
};

const plural = (n, un, varios) => (Number(n) === 1 ? un : varios);

function ordinal(n, i) {
  n = Number(n);
  if (i === 3) return `${n}.`;
  if (i === 0) {
    const r = n % 100;
    if (r >= 11 && r <= 13) return `${n}th`;
    return `${n}${["th", "st", "nd", "rd"][n % 10 < 4 ? n % 10 : 0]}`;
  }
  if (i === 1) return `${n}.º`;
  return n === 1 ? "1er" : `${n}e`;
}

// Cada patrón: [expresión, función(coincidencia, i)] con i: 0 inglés, 1 portugués, 2 francés
const PATRONES = [
  [/^(\d+) exactos? · (\d+) partidos?$/, (m, i) => `${m[1]} ${[plural(m[1], "exact", "exact"), plural(m[1], "exato", "exatos"), plural(m[1], "exact", "exacts")][i]} · ${m[2]} ${[plural(m[2], "match", "matches"), plural(m[2], "jogo", "jogos"), plural(m[2], "match", "matchs")][i]}`],
  [/^(\d+)% (local|empate|visitante)$/, (m, i) => `${m[1]}% ${{ local: ["home", "casa", "domicile"], empate: ["draw", "empate", "nul"], visitante: ["away", "fora", "extérieur"] }[m[2]][i]}`],
  [/^Pronóstico guardado: (\d+) – (\d+)$/, (m, i) => `${["Prediction saved", "Palpite guardado", "Pronostic enregistré"][i]}: ${m[1]} – ${m[2]}`],
  [/^¿Ocultar a "(.+)" de la clasificación\?$/, (m, i) => [`Hide "${m[1]}" from the ranking?`, `Ocultar "${m[1]}" da classificação?`, `Masquer « ${m[1]} » du classement ?`][i]],
  [/^(\d+) valoraci(?:ón|ones)$/, (m, i) => [`${m[1]} ${plural(m[1], "rating", "ratings")}`, `${m[1]} ${plural(m[1], "avaliação", "avaliações")}`, `${m[1]} ${plural(m[1], "note", "notes")}`][i]],
  [/^(\d+)\/100 caracteres$/, (m, i) => [`${m[1]}/100 characters`, `${m[1]}/100 caracteres`, `${m[1]}/100 caractères`][i]],
  [/^Valorar con (\d) estrellas?$/, (m, i) => [`Rate ${m[1]} ${plural(m[1], "star", "stars")}`, `Avaliar com ${m[1]} ${plural(m[1], "estrela", "estrelas")}`, `Noter ${m[1]} ${plural(m[1], "étoile", "étoiles")}`][i]],
  [/^(\d+) partidos?$/, (m, i) => `${m[1]} ${[plural(m[1], "match", "matches"), plural(m[1], "jogo", "jogos"), plural(m[1], "match", "matchs")][i]}`],
  [/^(\d+) equipos?$/, (m, i) => `${m[1]} ${[plural(m[1], "team", "teams"), plural(m[1], "equipa", "equipas"), plural(m[1], "équipe", "équipes")][i]}`],
  [/^(\d+) clubs?$/, (m, i) => `${m[1]} ${[plural(m[1], "club", "clubs"), plural(m[1], "clube", "clubes"), plural(m[1], "club", "clubs")][i]}`],
  [/^(\d+) categorías?$/, (m, i) => `${m[1]} ${[plural(m[1], "category", "categories"), plural(m[1], "categoria", "categorias"), plural(m[1], "catégorie", "catégories")][i]}`],
  [/^(\d+) (?:elegido|elegidos)$/, (m, i) => `${m[1]} ${[plural(m[1], "selected", "selected"), plural(m[1], "escolhido", "escolhidos"), plural(m[1], "choisi", "choisis")][i]}`],
  [/^(\d+) clubs · (\d+) equipos\. Toca un club para ver sus equipos\.$/, (m, i) => [
    `${m[1]} clubs · ${m[2]} teams. Tap a club to see its teams.`,
    `${m[1]} clubes · ${m[2]} equipas. Toca num clube para ver as suas equipas.`,
    `${m[1]} clubs · ${m[2]} équipes. Touchez un club pour voir ses équipes.`][i]],
  [/^(\d+) pabellones · (\d+) partidos\. Toca uno para ver su programación\.$/, (m, i) => [
    `${m[1]} venues · ${m[2]} matches. Tap one to see its schedule.`,
    `${m[1]} pavilhões · ${m[2]} jogos. Toca num para ver a sua programação.`,
    `${m[1]} gymnases · ${m[2]} matchs. Touchez-en un pour voir son programme.`][i]],
  [/^Empezó hace (\d+) min$/, (m, i) => [`Started ${m[1]} min ago`, `Começou há ${m[1]} min`, `A commencé il y a ${m[1]} min`][i]],
  [/^Grupo ([A-D])$/, (m, i) => [`Group ${m[1]}`, `Grupo ${m[1]}`, `Groupe ${m[1]}`][i]],
  [/^Serie (\d)$/, (m, i) => [`Series ${m[1]}`, `Série ${m[1]}`, `Série ${m[1]}`][i]],
  [/^Torneo (\d{4})$/, (m, i) => [`Tournament ${m[1]}`, `Torneio ${m[1]}`, `Tournoi ${m[1]}`][i]],
  [/^(.+) \(Grupo ([A-D]|Único)\)$/, (m, i) => `${m[1]} (${[`Group ${m[2] === "Único" ? "single" : m[2]}`, `Grupo ${m[2] === "Único" ? "único" : m[2]}`, `Groupe ${m[2] === "Único" ? "unique" : m[2]}`][i]})`],
  [/^(Infantil|Cadete|Juvenil) (Masculino|Femenino)$/, (m, i) => `${m[1]} ${traducirExacto(m[2], i)}`],
  [/^(\d+)º \/ (\d+)º$/, (m, i) => `${ordinal(m[1], i)} / ${ordinal(m[2], i)}`],
  [/^(\d+)\.º y (\d+)\.º puesto$/, (m, i) => [`${ordinal(m[1], 0)} & ${ordinal(m[2], 0)} place`, `${ordinal(m[1], 1)} e ${ordinal(m[2], 1)} lugar`, `${ordinal(m[1], 2)} et ${ordinal(m[2], 2)} place`][i]],
  [/^Escudo de (.+)$/, (m, i) => [`Crest of ${m[1]}`, `Brasão de ${m[1]}`, `Écusson de ${m[1]}`][i]],
  [/^Marcador (\d+) a (\d+)$/, (m, i) => [`Score ${m[1]} to ${m[2]}`, `Marcador ${m[1]} a ${m[2]}`, `Score ${m[1]} à ${m[2]}`][i]],
  [/^Pabellón (.+): (\d+) partidos?$/, (m, i) => [`Venue ${m[1]}: ${m[2]} ${plural(m[2], "match", "matches")}`, `Pavilhão ${m[1]}: ${m[2]} ${plural(m[2], "jogo", "jogos")}`, `Gymnase ${m[1]} : ${m[2]} ${plural(m[2], "match", "matchs")}`][i]],
  [/^Añadir un gol a (.+)$/, (m, i) => [`Add a goal to ${m[1]}`, `Adicionar um golo a ${m[1]}`, `Ajouter un but à ${m[1]}`][i]],
  [/^Quitar un gol a (.+)$/, (m, i) => [`Remove a goal from ${m[1]}`, `Retirar um golo a ${m[1]}`, `Retirer un but à ${m[1]}`][i]],
  [/^Goles de (.+)$/, (m, i) => [`Goals for ${m[1]}`, `Golos de ${m[1]}`, `Buts de ${m[1]}`][i]],
  [/^(.+) contra (.+)$/, (m, i) => [`${m[1]} vs ${m[2]}`, `${m[1]} vs ${m[2]}`, `${m[1]} contre ${m[2]}`][i]],
  [/^Modo (\S+) activado$/, (m, i) => [`${m[1]} mode on`, `Modo ${m[1]} ativado`, `Mode ${m[1]} activé`][i]],
  [/^Activados · (.+)$/, (m, i) => `${["On", "Ativados", "Activées"][i]} · ${m[1].split(" y ").map(p => traducirExacto(p, i)).join([" and ", " e ", " et "][i])}`],
  [/^¿Eliminar el club "(.+)"\?$/, (m, i) => [`Delete the club "${m[1]}"?`, `Eliminar o clube "${m[1]}"?`, `Supprimer le club « ${m[1]} » ?`][i]],
  [/^¿Eliminar "(.+)"\?$/, (m, i) => [`Delete "${m[1]}"?`, `Eliminar "${m[1]}"?`, `Supprimer « ${m[1]} » ?`][i]],
  [/^(lunes|martes|miércoles|jueves|viernes|sábado|domingo), (\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)$/i, (m, i) => {
    const cod = ["en", "pt", "fr"][i];
    const dia = SEMANA[cod][SEMANA.es.indexOf(m[1].toLowerCase())];
    const mes = MESES[cod][MESES.es.indexOf(m[3].toLowerCase())];
    const n = Number(m[2]);
    if (i === 0) return `${dia}, ${n} ${mes}`;
    if (i === 1) return `${dia}, ${n} de ${mes}`;
    return `${dia} ${n === 1 ? "1er" : n} ${mes}`;
  }]
];


// Patrones en alemán (mismas expresiones, resultado en alemán)
const PATRONES_DE = [
  [/^(\d+) exactos? · (\d+) partidos?$/, m => `${m[1]} ${plural(m[1], "genaues", "genaue")} · ${m[2]} ${plural(m[2], "Spiel", "Spiele")}`],
  [/^(\d+)% (local|empate|visitante)$/, m => `${m[1]}% ${{ local: "Heim", empate: "Remis", visitante: "Gast" }[m[2]]}`],
  [/^Pronóstico guardado: (\d+) – (\d+)$/, m => `Tipp gespeichert: ${m[1]} – ${m[2]}`],
  [/^¿Ocultar a "(.+)" de la clasificación\?$/, m => `„${m[1]}“ aus der Rangliste ausblenden?`],
  [/^(\d+) valoraci(?:ón|ones)$/, m => `${m[1]} ${plural(m[1], "Bewertung", "Bewertungen")}`],
  [/^(\d+)\/100 caracteres$/, m => `${m[1]}/100 Zeichen`],
  [/^Valorar con (\d) estrellas?$/, m => `Mit ${m[1]} ${plural(m[1], "Stern", "Sternen")} bewerten`],
  [/^(\d+) partidos?$/, m => `${m[1]} ${plural(m[1], "Spiel", "Spiele")}`],
  [/^(\d+) equipos?$/, m => `${m[1]} ${plural(m[1], "Team", "Teams")}`],
  [/^(\d+) clubs?$/, m => `${m[1]} ${plural(m[1], "Verein", "Vereine")}`],
  [/^(\d+) categorías?$/, m => `${m[1]} ${plural(m[1], "Kategorie", "Kategorien")}`],
  [/^(\d+) (?:elegido|elegidos)$/, m => `${m[1]} ${plural(m[1], "ausgewählt", "ausgewählt")}`],
  [/^(\d+) clubs · (\d+) equipos\. Toca un club para ver sus equipos\.$/, m => `${m[1]} Vereine · ${m[2]} Teams. Tippe auf einen Verein, um seine Teams zu sehen.`],
  [/^(\d+) pabellones · (\d+) partidos\. Toca uno para ver su programación\.$/, m => `${m[1]} Hallen · ${m[2]} Spiele. Tippe auf eine Halle, um ihren Spielplan zu sehen.`],
  [/^Empezó hace (\d+) min$/, m => `Begann vor ${m[1]} Min.`],
  [/^Grupo ([A-D])$/, m => `Gruppe ${m[1]}`],
  [/^Serie (\d)$/, m => `Serie ${m[1]}`],
  [/^Torneo (\d{4})$/, m => `Turnier ${m[1]}`],
  [/^(.+) \(Grupo ([A-D]|Único)\)$/, m => `${m[1]} (Gruppe ${m[2] === "Único" ? "einzeln" : m[2]})`],
  [/^(Infantil|Cadete|Juvenil) (Masculino|Femenino)$/, m => `${m[1]} ${traducirExacto(m[2], 3)}`],
  [/^(\d+)º \/ (\d+)º$/, m => `${m[1]}. / ${m[2]}.`],
  [/^(\d+)\.º y (\d+)\.º puesto$/, m => `Platz ${m[1]} und ${m[2]}`],
  [/^Escudo de (.+)$/, m => `Wappen von ${m[1]}`],
  [/^Marcador (\d+) a (\d+)$/, m => `Spielstand ${m[1]} zu ${m[2]}`],
  [/^Pabellón (.+): (\d+) partidos?$/, m => `Halle ${m[1]}: ${m[2]} ${plural(m[2], "Spiel", "Spiele")}`],
  [/^Añadir un gol a (.+)$/, m => `Ein Tor für ${m[1]} hinzufügen`],
  [/^Quitar un gol a (.+)$/, m => `Ein Tor von ${m[1]} abziehen`],
  [/^Goles de (.+)$/, m => `Tore von ${m[1]}`],
  [/^(.+) contra (.+)$/, m => `${m[1]} gegen ${m[2]}`],
  [/^Modo (\S+) activado$/, m => `Modus ${m[1]} aktiviert`],
  [/^Activados · (.+)$/, m => `Aktiviert · ${m[1].split(" y ").map(p => traducirExacto(p, 3)).join(" und ")}`],
  [/^¿Eliminar el club "(.+)"\?$/, m => `Den Verein „${m[1]}“ löschen?`],
  [/^¿Eliminar "(.+)"\?$/, m => `„${m[1]}“ löschen?`],
  [/^(lunes|martes|miércoles|jueves|viernes|sábado|domingo), (\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)$/i, m =>
    `${SEMANA.de[SEMANA.es.indexOf(m[1].toLowerCase())]}, ${Number(m[2])}. ${MESES.de[MESES.es.indexOf(m[3].toLowerCase())]}`]
];

/* ------------------------- motor de traducción ------------------------- */
let idioma = "es";

function traducirExacto(clave, i) {
  if (i === 3) {
    if (DE[clave] !== undefined) return DE[clave];
  } else {
    const fila = TEXTOS[clave];
    if (fila) return fila[i];
  }
  for (const [re, fn] of (i === 3 ? PATRONES_DE : PATRONES)) {
    const m = re.exec(clave);
    if (m) return fn(m, i);
  }
  return clave;
}

// Traduce una frase (conserva los espacios del principio y del final)
function traducirConIndice(texto, i) {
  const s = String(texto);
  const ini = s.length - s.trimStart().length;
  const fin = s.length - s.trimEnd().length;
  const nucleo = s.slice(ini, s.length - fin).replace(/\s+/g, " ");
  if (!nucleo) return s;

  let r = traducirExacto(nucleo, i);

  // "Infantil · Masculino · Grupo A": se traduce cada trozo por separado
  if (r === nucleo && nucleo.includes(" · ")) {
    const trozos = nucleo.split(" · ").map(t => traducirExacto(t.trim(), i));
    const unido = trozos.join(" · ");
    if (unido !== nucleo) r = unido;
  }

  return r === nucleo ? s : s.slice(0, ini) + r + s.slice(s.length - fin);
}

// Para los textos que escribe la app por código (confirm, prompt, notificaciones...)
export function t(texto) {
  if (idioma === "es") return texto;
  return traducirConIndice(texto, INDICE[idioma]);
}

/* ------------------------- recorrido del DOM ------------------------- */
const ATRIBUTOS = ["placeholder", "aria-label", "title", "alt"];
const textosOriginales = new WeakMap();   // nodo de texto -> { orig, puesto }
const attrsOriginales = new WeakMap();    // elemento -> { atributo: { orig, puesto } }
let observador = null;

function ignorado(el) {
  return !el || /^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT|SVG)$/i.test(el.tagName) || el.closest?.("[translate='no']");
}

function procesarTexto(nodo) {
  const el = nodo.parentElement;
  if (ignorado(el)) return;

  const reg = textosOriginales.get(nodo);
  if (reg && nodo.nodeValue === reg.puesto) {
    // ya está traducido: solo se retraduce si cambió el idioma
    if (reg.i === INDICE[idioma]) return;
    nodo.nodeValue = reg.orig;
  }

  const original = nodo.nodeValue;
  if (idioma === "es") { textosOriginales.delete(nodo); return; }

  // un <option> sin value usa su texto como valor: se fija antes de traducir
  if (el.tagName === "OPTION" && !el.hasAttribute("value")) {
    el.setAttribute("value", original.replace(/\s+/g, " ").trim());
  }

  const i = INDICE[idioma];
  const traducido = traducirConIndice(original, i);
  if (traducido !== original) {
    textosOriginales.set(nodo, { orig: original, puesto: traducido, i });
    nodo.nodeValue = traducido;
  } else {
    textosOriginales.delete(nodo);
  }
}

function procesarAtributo(el, attr) {
  if (ignorado(el)) return;
  const mapa = attrsOriginales.get(el) || {};
  const reg = mapa[attr];
  const actual = el.getAttribute(attr);
  if (actual === null) return;

  if (reg && actual === reg.puesto) {
    if (reg.i === INDICE[idioma]) return;
    el.setAttribute(attr, reg.orig);
  }

  const original = el.getAttribute(attr);
  if (idioma === "es") { if (reg) { delete mapa[attr]; } return; }

  const i = INDICE[idioma];
  const traducido = traducirConIndice(original, i);
  if (traducido !== original) {
    mapa[attr] = { orig: original, puesto: traducido, i };
    attrsOriginales.set(el, mapa);
    el.setAttribute(attr, traducido);
  } else if (reg) {
    delete mapa[attr];
  }
}

function procesarArbol(raiz) {
  if (raiz.nodeType === 3) { procesarTexto(raiz); return; }
  if (raiz.nodeType !== 1) return;

  if (!ignorado(raiz)) ATRIBUTOS.forEach(a => raiz.hasAttribute(a) && procesarAtributo(raiz, a));

  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  while (w.nextNode()) {
    const n = w.currentNode;
    if (n.nodeType === 3) procesarTexto(n);
    else ATRIBUTOS.forEach(a => n.hasAttribute(a) && procesarAtributo(n, a));
  }
}

function alCambiarElDom(registros) {
  for (const r of registros) {
    if (r.type === "childList") r.addedNodes.forEach(procesarArbol);
    else if (r.type === "characterData") procesarTexto(r.target);
    else if (r.type === "attributes") procesarAtributo(r.target, r.attributeName);
  }
}

/* ------------------------- título y descripción de la página ------------------------- */
const metaOriginal = {};

function traducirCabecera() {
  const i = INDICE[idioma];
  const descripcion = document.querySelector('meta[name="description"]');
  if (metaOriginal.titulo === undefined) {
    metaOriginal.titulo = document.title;
    metaOriginal.descripcion = descripcion ? descripcion.getAttribute("content") : "";
  }
  if (idioma === "es") {
    document.title = metaOriginal.titulo;
    if (descripcion) descripcion.setAttribute("content", metaOriginal.descripcion);
  } else {
    document.title = traducirConIndice(metaOriginal.titulo, i);
    if (descripcion) descripcion.setAttribute("content", traducirConIndice(metaOriginal.descripcion, i));
  }
}

/* ------------------------- selector de idioma ------------------------- */
function detectarIdioma() {
  try {
    const guardado = localStorage.getItem("idioma");
    if (CODIGOS.includes(guardado)) return guardado;
  } catch (e) { /* sin almacenamiento */ }

  const preferidos = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "es"];
  for (const l of preferidos) {
    const base = String(l).slice(0, 2).toLowerCase();
    if (CODIGOS.includes(base)) return base;
  }
  return "es";
}

function pintarSelector() {
  const boton = document.getElementById("idioma-boton");
  const menu = document.getElementById("idioma-menu");
  if (!boton || !menu) return;

  boton.querySelector(".idioma-bandera").style.backgroundImage = urlBandera(idioma);
  boton.setAttribute("aria-label", `${traducirConIndice("Idioma", idioma === "es" ? -1 : INDICE[idioma]) || "Idioma"}: ${NOMBRES[idioma]}`);

  menu.querySelectorAll("[data-idioma]").forEach(op => {
    const activo = op.dataset.idioma === idioma;
    op.setAttribute("aria-checked", activo ? "true" : "false");
    op.classList.toggle("activo", activo);
  });
}

function abrirMenu(abrir) {
  const caja = document.getElementById("idioma-fab");
  const boton = document.getElementById("idioma-boton");
  if (!caja || !boton) return;
  caja.classList.toggle("abierto", abrir);
  boton.setAttribute("aria-expanded", abrir ? "true" : "false");
}

export function cambiarIdioma(cod) {
  if (!CODIGOS.includes(cod)) return;
  idioma = cod;
  try { localStorage.setItem("idioma", cod); } catch (e) { /* sin almacenamiento */ }

  document.documentElement.lang = cod;
  traducirCabecera();

  // se vuelve a recorrer toda la página con el idioma nuevo
  if (observador) observador.takeRecords();
  procesarArbol(document.body);
  pintarSelector();
  abrirMenu(false);
}

export function iniciarIdioma() {
  const menu = document.getElementById("idioma-menu");
  const boton = document.getElementById("idioma-boton");

  if (menu && boton) {
    menu.innerHTML = CODIGOS.map(cod => `
      <button type="button" role="menuitemradio" class="idioma-opcion" data-idioma="${cod}" aria-checked="false" lang="${cod}">
        <span class="idioma-bandera" style="background-image:${urlBandera(cod)}" aria-hidden="true"></span>
        <span>${NOMBRES[cod]}</span>
      </button>`).join("");

    boton.addEventListener("click", e => {
      e.stopPropagation();
      abrirMenu(!document.getElementById("idioma-fab").classList.contains("abierto"));
    });
    menu.addEventListener("click", e => {
      const op = e.target.closest("[data-idioma]");
      if (op) cambiarIdioma(op.dataset.idioma);
    });
    document.addEventListener("click", e => {
      const caja = document.getElementById("idioma-fab");
      if (caja && !caja.contains(e.target)) abrirMenu(false);
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") abrirMenu(false); });
  }

  // el observador vigila lo que la app va pintando (pantallas, avisos, marcadores...)
  observador = new MutationObserver(alCambiarElDom);
  observador.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATRIBUTOS
  });

  // confirm() y prompt() son del navegador: se les pasa el texto ya traducido
  const confirmarOriginal = window.confirm.bind(window);
  const preguntarOriginal = window.prompt.bind(window);
  window.confirm = mensaje => confirmarOriginal(t(mensaje));
  window.prompt = (mensaje, valor) => preguntarOriginal(t(mensaje), valor);

  cambiarIdioma(detectarIdioma());
}
