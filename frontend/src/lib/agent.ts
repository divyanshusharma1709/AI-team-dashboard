export class TeamDashboardAgent {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://teamdashboard-production.up.railway.app';
  }

  async process_query(query: string) {
    try {
      console.log('Making request to:', `${this.apiUrl}/query`);
      const response = await fetch(`${this.apiUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      
      // The backend returns { response: string } where response is a plain text string
      if (typeof data.response === 'string') {
        return { text: data.response };
      }
      
      // Fallback to empty response if no text is found
      return { text: 'No response received from the server.' };
    } catch (error) {
      console.error('Error processing query:', error);
      return { text: 'An error occurred while processing your query.' };
    }
  }
} 