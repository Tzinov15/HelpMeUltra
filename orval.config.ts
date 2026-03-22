import { defineConfig } from 'orval'

export default defineConfig({
  strava: {
    input: {
      target: './strava-swagger.json',
      validation: false,
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/generated',
      schemas: 'src/api/generated/models',
      client: 'react-query',
      httpClient: 'axios',
      override: {
        mutator: {
          path: 'src/api/client.ts',
          name: 'stravaAxiosInstance',
        },
        query: {
          useQuery: true,
          useInfinite: false,
        },
      },
    },
  },
})
