import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, User, Phone, MapPin, Upload, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

const Patients = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const query = searchQuery.toLowerCase();
    return (
      patient.first_name?.toLowerCase().includes(query) ||
      patient.last_name?.toLowerCase().includes(query) ||
      patient.phone?.includes(query) ||
      patient.email?.toLowerCase().includes(query)
    );
  });

  const handleDownloadSample = () => {
    // Create sample CSV data with all patient fields
    const sampleData = [
      [
        'first_name', 'last_name', 'date_of_birth', 'sa_id_number', 'phone', 'email',
        'address_line1', 'address_line2', 'suburb', 'city', 'province', 'postal_code',
        'medical_aid_provider', 'medical_aid_number', 'medical_aid_plan',
        'allergies', 'conditions', 'notes'
      ],
      [
        'John', 'Doe', '1980-05-15', '8005155678082', '+27123456789', 'john.doe@example.com',
        '123 Main Street', 'Apartment 4B', 'Sandton', 'Johannesburg', 'Gauteng', '2196',
        'Discovery Health', 'DH123456', 'Executive Plan',
        'Penicillin, Peanuts', 'Hypertension, Diabetes', 'Patient prefers morning appointments'
      ],
      [
        'Jane', 'Smith', '1992-11-22', '9211225678083', '+27987654321', 'jane.smith@example.com',
        '456 Oak Avenue', '', 'Sea Point', 'Cape Town', 'Western Cape', '8005',
        'Bonitas', 'BON789012', 'Standard Plan',
        '', 'Asthma', 'Requires inhaler during visits'
      ]
    ];

    // Convert to CSV string
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patients_import_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Sample downloaded",
      description: "Check your downloads folder for the sample CSV file."
    });
  };

  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload a CSV file."
      });
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

          // Validate headers
          const headers = jsonData[0];
          const requiredHeaders = ['first_name', 'last_name', 'phone'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
          
          if (missingHeaders.length > 0) {
            throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
          }

          // Get column indices
          const getIdx = (field: string) => headers.indexOf(field);

          // Process each row (skip header)
          const results = { success: 0, failed: 0, errors: [] as string[] };
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Skip empty rows
            if (!row || row.length === 0 || !row[getIdx('first_name')]) continue;

            try {
              // Parse allergies and conditions from comma-separated strings
              const allergiesStr = row[getIdx('allergies')]?.toString().trim() || '';
              const conditionsStr = row[getIdx('conditions')]?.toString().trim() || '';
              
              const patientData = {
                first_name: row[getIdx('first_name')]?.toString().trim(),
                last_name: row[getIdx('last_name')]?.toString().trim(),
                date_of_birth: row[getIdx('date_of_birth')]?.toString().trim() || null,
                sa_id_number: row[getIdx('sa_id_number')]?.toString().trim() || null,
                phone: row[getIdx('phone')]?.toString().trim(),
                email: row[getIdx('email')]?.toString().trim() || null,
                address_line1: row[getIdx('address_line1')]?.toString().trim() || null,
                address_line2: row[getIdx('address_line2')]?.toString().trim() || null,
                suburb: row[getIdx('suburb')]?.toString().trim() || null,
                city: row[getIdx('city')]?.toString().trim() || null,
                province: row[getIdx('province')]?.toString().trim() || null,
                postal_code: row[getIdx('postal_code')]?.toString().trim() || null,
                medical_aid_provider: row[getIdx('medical_aid_provider')]?.toString().trim() || null,
                medical_aid_number: row[getIdx('medical_aid_number')]?.toString().trim() || null,
                medical_aid_plan: row[getIdx('medical_aid_plan')]?.toString().trim() || null,
                allergies: allergiesStr ? allergiesStr.split(',').map(a => a.trim()).filter(Boolean) : [],
                conditions: conditionsStr ? conditionsStr.split(',').map(c => c.trim()).filter(Boolean) : [],
                notes: row[getIdx('notes')]?.toString().trim() || null,
              };

              // Insert patient
              const { error } = await supabase
                .from('patients')
                .insert(patientData);

              if (error) {
                throw new Error(error.message);
              }

              results.success++;
            } catch (error: any) {
              results.failed++;
              results.errors.push(`Row ${i + 1} (${row[getIdx('first_name')]} ${row[getIdx('last_name')]}): ${error.message}`);
            }
          }

          // Show results
          if (results.success > 0) {
            toast({
              title: "Import completed",
              description: `Successfully imported ${results.success} patient(s). ${results.failed > 0 ? `${results.failed} failed.` : ''}`
            });
          }

          if (results.errors.length > 0) {
            console.error('Import errors:', results.errors);
            toast({
              variant: "destructive",
              title: "Some imports failed",
              description: `${results.failed} patient(s) failed to import. Check console for details.`
            });
          }

          fetchPatients();
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Import failed",
            description: error.message
          });
        } finally {
          setLoading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      reader.readAsBinaryString(file);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error reading file",
        description: error.message
      });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Patients</h1>
          <p className="text-muted-foreground">
            Manage patient records and information
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="outline" onClick={handleDownloadSample}>
            <Download className="h-4 w-4 mr-2" />
            Download Sample CSV
          </Button>
          <Button variant="outline" onClick={handleImportCSV}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => navigate("/patients/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Patient
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No patients found</p>
            {searchQuery && (
              <p className="text-sm mt-2">Try adjusting your search</p>
            )}
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              className="card-hover cursor-pointer"
              onClick={() => navigate(`/patients/${patient.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {patient.first_name} {patient.last_name}
                      </h3>
                      {patient.date_of_birth && (
                        <p className="text-sm text-muted-foreground">
                          Born {new Date(patient.date_of_birth).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {patient.consent_signed && (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      Consented
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {patient.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  {patient.city && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{patient.city}, {patient.province}</span>
                    </div>
                  )}
                </div>

                {(patient.allergies?.length > 0 || patient.conditions?.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies?.slice(0, 2).map((allergy: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="badge-urgent text-xs">
                          {allergy}
                        </Badge>
                      ))}
                      {patient.conditions?.slice(0, 2).map((condition: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Patients;