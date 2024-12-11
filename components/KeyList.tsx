import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function KeyList({ keys }: { keys: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Keys</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-5">
          {keys.map((key) => (
            <li key={key}>{key}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

