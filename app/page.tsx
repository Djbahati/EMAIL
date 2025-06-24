import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Shield, Users, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">X-Ticket Email Server</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive email management solution with enterprise-grade security, seamless integration, and
            user-friendly administration.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white text-gray-900">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Mail className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Professional Email</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get your @x-ticket.com email address with full email management capabilities.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Enterprise Security</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Advanced security measures including encryption, spam filtering, and access controls.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive admin tools for managing users, departments, and email policies.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Seamless Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Easy integration with existing infrastructure and third-party email clients.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">For Employees</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Professional @x-ticket.com email address</li>
                <li>• Email aliases and forwarding</li>
                <li>• Generous storage quotas</li>
                <li>• Mobile and desktop client support</li>
                <li>• Spam and virus protection</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">For Administrators</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Centralized user management</li>
                <li>• Email routing and policies</li>
                <li>• Usage analytics and reporting</li>
                <li>• Security monitoring</li>
                <li>• Backup and recovery tools</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
