import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';
import { searchLocations, formatLocation, type LocationSearchResult } from '@/services/location/geocoding';

export function LocationPicker({ value, onSelect, onUseCurrent, loading=false }: {
  value?: string;
  onSelect:(location:{latitude:number;longitude:number;label:string})=>void;
  onUseCurrent?:()=>void;
  loading?:boolean;
}) {
  const { colors }=useTheme();
  const [query,setQuery]=useState(value??'');
  const [results,setResults]=useState<LocationSearchResult[]>([]);
  const [searching,setSearching]=useState(false);

  useEffect(()=>{
    const handle=setTimeout(async()=>{
      if(query.trim().length<2){setResults([]);return;}
      setSearching(true);
      try { setResults(await searchLocations(query)); }
      catch(error){ Alert.alert('Location search unavailable', error instanceof Error ? error.message : 'Please try again.'); }
      finally { setSearching(false); }
    },350);
    return ()=>clearTimeout(handle);
  },[query]);

  return <View style={styles.wrap}>
    <AppTextField label="Farm / home location" placeholder="Search your village, town or district" value={query} onChangeText={setQuery} />
    {onUseCurrent ? <Pressable onPress={onUseCurrent} disabled={loading} style={[styles.current,{borderColor:colors.border}]}>
      <AppText>{loading ? 'Finding your location…' : '◎ Use my current location'}</AppText>
    </Pressable>:null}
    {searching ? <AppText variant="caption">Searching Botswana locations…</AppText>:null}
    {results.map(result=><Pressable key={String(result.id)} onPress={()=>{
      const label=formatLocation(result); setQuery(label); setResults([]);
      onSelect({latitude:result.latitude,longitude:result.longitude,label});
    }} style={[styles.result,{borderColor:colors.border,backgroundColor:colors.surface}]}>
      <AppText variant="headline">{result.name}</AppText>
      <AppText variant="caption">{[result.admin2,result.admin1,result.country].filter(Boolean).join(' • ')}</AppText>
    </Pressable>)}
  </View>;
}
const styles=StyleSheet.create({wrap:{gap:Spacing.sm,marginBottom:Spacing.md},current:{borderWidth:1,borderRadius:14,padding:12,alignSelf:'flex-start'},result:{borderWidth:1,borderRadius:14,padding:12,gap:4}});
