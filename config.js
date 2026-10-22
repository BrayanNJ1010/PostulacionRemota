// Configuración del buscador. Cambia aquí los filtros sin tocar el resto del código.

export default {
  // Solo se envían vacantes con este ajuste (%) o más respecto al CV.
  puntajeMinimo: 90,

  // Salario mensual en COP. Si la vacante publica salario y su máximo está por debajo del mínimo, se descarta.
  // salarioMaximo: null = sin tope (si pagan más, también sirve).
  salarioMinimo: 4_600_000,
  salarioMaximo: null,
  tasaUSD: 4000, // para convertir salarios publicados en dólares

  // Se descartan vacantes que pidan más años de experiencia que esto.
  maxAniosExperiencia: 6,

  // Cada cuántas horas busca vacantes nuevas.
  intervaloHoras: 3,

  linkedin: {
    // Siempre filtra: Colombia, 100% remoto y Solicitud sencilla.
    ubicacion: 'Colombia',
    busquedas: [
      'desarrollador .NET',
      'desarrollador C#',
      '.NET developer',
      'desarrollador fullstack .NET',
      'desarrollador backend .NET',
      'Blazor',
    ],
    paginas: 2, // 10 vacantes por página
  },

  computrabajo: {
    // Se usan como https://co.computrabajo.com/trabajo-de-<busqueda>
    busquedas: [
      'desarrollador-net',
      'desarrollador-c',
      'programador-net',
      'desarrollador-full-stack-net',
      'desarrollador-backend-net',
      'blazor',
    ],
    paginas: 2, // 20 vacantes por página
  },

  // Tecnologías del CV: 1 = la dominas, 0.5 = cercana o parcial.
  // Lo que aparezca en "tecnologiasNoCV" cuenta como 0 y baja el ajuste.
  tecnologiasCV: {
    '.NET': [1, /\.net\b|dotnet|net\s*core/i],
    'C#': [1, /c#|c\s*sharp|csharp/i],
    'ASP.NET': [1, /asp\.?\s*net/i],
    'Entity Framework': [1, /entity\s*framework|\bef\s*core/i],
    'LINQ': [1, /\blinq\b/i],
    'Web API / REST': [1, /web\s*api|\brest(ful)?\b|api\s*rest/i],
    'SOAP': [1, /\bsoap\b|\bwcf\b/i],
    'Blazor': [1, /blazor/i],
    'MudBlazor': [1, /mudblazor/i],
    'Angular': [1, /angular/i],
    'TypeScript': [1, /typescript/i],
    'JavaScript': [1, /javascript|\bjs\b|es6/i],
    'HTML/CSS': [1, /html|css/i],
    'Bootstrap': [1, /bootstrap/i],
    'React': [1, /\breact(\.?js)?\b(?!\s*native)/i],
    'Vue': [1, /\bvue(\.?js)?\b/i],
    'SQL Server': [1, /sql\s*server|mssql|t-?sql/i],
    'Oracle / PL/SQL': [1, /oracle|pl\s*\/?\s*sql/i],
    'MongoDB': [1, /mongo/i],
    'Azure DevOps / CI/CD': [1, /azure\s*devops|ci\s*\/\s*cd|pipelines/i],
    'Git': [1, /\bgit\b|github|gitlab|bitbucket/i],
    'Docker': [1, /docker|contenedores/i],
    'Microservicios': [1, /microservici|microservice/i],
    'MVC': [1, /\bmvc\b/i],
    'Node.js': [1, /node\.?js|\bnode\b/i],
    'SOLID / Clean Code': [1, /\bsolid\b|clean\s*(code|architecture)|arquitectura\s*limpia/i],
    'Pruebas unitarias': [1, /pruebas\s*unitarias|unit\s*test|xunit|nunit|mstest/i],
    'Azure (nube)': [0.5, /\bazure\b(?!\s*devops)/i],
    'PostgreSQL / MySQL': [0.5, /postgre|mysql|mariadb/i],
    'Redis': [0.5, /\bredis\b/i],
    'WPF / WinForms': [0.5, /\bwpf\b|win\s*forms/i],
    'VB.NET': [0.5, /vb\.?\s*net|visual\s*basic/i],
    '.NET MAUI / Xamarin': [0.5, /\bmaui\b|xamarin/i],
  },

  tecnologiasNoCV: {
    'Java': /\bjava\b(?!\s*script)|spring\s*boot/i,
    'Python': /python|django|flask|fastapi/i,
    'PHP': /\bphp\b|laravel|symfony/i,
    'Ruby': /\bruby\b|rails/i,
    'Go': /golang/i,
    'Kotlin / Swift': /kotlin|\bswift\b/i,
    'Flutter / React Native': /flutter|react\s*native/i,
    'AWS': /\baws\b|amazon\s*web\s*services|lambda/i,
    'GCP': /\bgcp\b|google\s*cloud/i,
    'Kubernetes': /kubernetes|\bk8s\b|\baks\b|\beks\b/i,
    'Terraform': /terraform/i,
    'Kafka / RabbitMQ': /kafka|rabbit\s*mq/i,
    'GraphQL': /graphql/i,
    'Salesforce': /salesforce|apex/i,
    'SAP': /\bsap\b|abap/i,
    'Power Platform': /power\s*apps|power\s*automate|dynamics\s*365|sharepoint/i,
    'Unity': /\bunity\b/i,
    'COBOL': /cobol/i,
  },
};
