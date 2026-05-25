"use client";

import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

type PinyinMode = "tone" | "notone" | "initial";

/** Simplified pinyin mapping for common ~800 characters */
const PINYIN_MAP: Record<string, string> = {
  "的":"de","一":"yī","是":"shì","不":"bù","了":"liǎo","人":"rén","我":"wǒ","在":"zài","有":"yǒu","他":"tā",
  "这":"zhè","中":"zhōng","来":"lái","个":"gè","上":"shàng","们":"men","到":"dào","说":"shuō","时":"shí","大":"dà",
  "为":"wéi","子":"zǐ","和":"hé","你":"nǐ","地":"dì","出":"chū","也":"yě","道":"dào","要":"yào","会":"huì",
  "可":"kě","以":"yǐ","没":"méi","那":"nà","她":"tā","生":"shēng","它":"tā","而":"ér","于":"yú","下":"xià",
  "就":"jiù","年":"nián","多":"duō","还":"hái","能":"néng","对":"duì","发":"fā","作":"zuò","里":"lǐ","后":"hòu",
  "然":"rán","之":"zhī","用":"yòng","着":"zhe","自":"zì","去":"qù","好":"hǎo","看":"kàn","过":"guò","被":"bèi",
  "从":"cóng","情":"qíng","三":"sān","面":"miàn","前":"qián","所":"suǒ","问":"wèn","但":"dàn","最":"zuì","方":"fāng",
  "已":"yǐ","经":"jīng","像":"xiàng","把":"bǎ","两":"liǎng","现":"xiàn","开":"kāi","想":"xiǎng","些":"xiē","只":"zhǐ",
  "样":"yàng","点":"diǎn","心":"xīn","起":"qǐ","见":"jiàn","因":"yīn","无":"wú","知":"zhī","事":"shì","正":"zhèng",
  "新":"xīn","手":"shǒu","又":"yòu","十":"shí","使":"shǐ","力":"lì","与":"yǔ","等":"děng","体":"tǐ","第":"dì",
  "台":"tái","门":"mén","相":"xiāng","民":"mín","四":"sì","话":"huà","很":"hěn","口":"kǒu","位":"wèi","次":"cì",
  "回":"huí","进":"jìn","当":"dāng","关":"guān","长":"cháng","天":"tiān","高":"gāo","定":"dìng","白":"bái","加":"jiā",
  "小":"xiǎo","文":"wén","工":"gōng","给":"gěi","水":"shuǐ","家":"jiā","外":"wài","意":"yì","明":"míng","行":"xíng",
  "电":"diàn","学":"xué","主":"zhǔ","目":"mù","老":"lǎo","机":"jī","动":"dòng","平":"píng","东":"dōng","书":"shū",
  "法":"fǎ","分":"fēn","成":"chéng","全":"quán","走":"zǒu","量":"liàng","变":"biàn","实":"shí","表":"biǎo","内":"nèi",
  "产":"chǎn","海":"hǎi","通":"tōng","交":"jiāo","系":"xì","重":"zhòng","制":"zhì","教":"jiào","组":"zǔ","期":"qī",
  "区":"qū","政":"zhèng","应":"yīng","则":"zé","感":"gǎn","度":"dù","北":"běi","信":"xìn","合":"hé","更":"gèng",
  "别":"bié","身":"shēn","战":"zhàn","处":"chù","公":"gōng","头":"tóu","本":"běn","部":"bù","德":"dé","马":"mǎ",
  "原":"yuán","立":"lì","解":"jiě","名":"míng","做":"zuò","二":"èr","世":"shì","总":"zǒng","路":"lù","记":"jì",
  "管":"guǎn","入":"rù","务":"wù","数":"shù","将":"jiāng","军":"jūn","化":"huà","命":"mìng","常":"cháng","西":"xī",
  "少":"shǎo","安":"ān","南":"nán","山":"shān","城":"chéng","色":"sè","打":"dǎ","受":"shòu","亲":"qīn","至":"zhì",
  "代":"dài","男":"nán","师":"shī","识":"shí","各":"gè","太":"tài","连":"lián","步":"bù","万":"wàn","运":"yùn",
  "种":"zhǒng","神":"shén","报":"bào","选":"xuǎn","保":"bǎo","改":"gǎi","风":"fēng","治":"zhì","展":"zhǎn","林":"lín",
  "美":"měi","带":"dài","队":"duì","场":"chǎng","真":"zhēn","热":"rè","比":"bǐ","五":"wǔ","干":"gàn","共":"gòng",
  "达":"dá","建":"jiàn","委":"wěi","级":"jí","任":"rèn","片":"piàn","越":"yuè","快":"kuài","斯":"sī","特":"tè",
  "今":"jīn","半":"bàn","让":"ràng","转":"zhuǎn","死":"sǐ","食":"shí","满":"mǎn","失":"shī","容":"róng","往":"wǎng",
  "眼":"yǎn","求":"qiú","买":"mǎi","写":"xiě","河":"hé","八":"bā","办":"bàn","思":"sī","照":"zhào","红":"hóng",
  "流":"liú","百":"bǎi","图":"tú","界":"jiè","张":"zhāng","纪":"jì","果":"guǒ","传":"chuán","须":"xū","竟":"jìng",
  "单":"dān","杀":"shā","视":"shì","乎":"hū","听":"tīng","拉":"lā","党":"dǎng","答":"dá","举":"jǔ","王":"wáng",
  "绝":"jué","觉":"jué","程":"chéng","深":"shēn","底":"dǐ","故":"gù","般":"bān","草":"cǎo","望":"wàng","状":"zhuàng",
  "致":"zhì","站":"zhàn","终":"zhōng","养":"yǎng","歌":"gē","费":"fèi","备":"bèi","桥":"qiáo","馆":"guǎn","层":"céng",
  "术":"shù","黑":"hēi","具":"jù","商":"shāng","青":"qīng","夜":"yè","光":"guāng","拿":"ná","装":"zhuāng","强":"qiáng",
  "切":"qiè","请":"qǐng","春":"chūn","足":"zú","且":"qiě","跟":"gēn","似":"sì","结":"jié","气":"qì","早":"zǎo",
  "空":"kōng","接":"jiē","村":"cūn","持":"chí","短":"duǎn","设":"shè","坐":"zuò","石":"shí","病":"bìng","支":"zhī",
  "条":"tiáo","济":"jì","取":"qǔ","星":"xīng","便":"biàn","反":"fǎn","近":"jìn","周":"zhōu","送":"sòng","妻":"qī",
  "历":"lì","穿":"chuān","落":"luò","算":"suàn","树":"shù","刚":"gāng","药":"yào","读":"dú","花":"huā","鸟":"niǎo",
  "钱":"qián","湖":"hú","球":"qiú","音":"yīn","广":"guǎng","船":"chuán","皮":"pí","喜":"xǐ","客":"kè","雪":"xuě",
  "画":"huà","狗":"gǒu","酒":"jiǔ","跑":"pǎo","鱼":"yú","茶":"chá","猫":"māo","飞":"fēi","云":"yún","车":"chē",
  "金":"jīn","木":"mù","火":"huǒ","土":"tǔ","月":"yuè","日":"rì","龙":"lóng","雨":"yǔ","江":"jiāng","国":"guó",
  "耳":"ěr","衣":"yī","住":"zhù","父":"fù","母":"mǔ","兄":"xiōng","弟":"dì","姐":"jiě","妹":"mèi","女":"nǚ",
  "低":"dī","远":"yuǎn","慢":"màn","晚":"wǎn","旧":"jiù","坏":"huài","丑":"chǒu","善":"shàn","恶":"è","假":"jiǎ",
  "冷":"lěng","暗":"àn","轻":"qīng","软":"ruǎn","硬":"yìng","绿":"lǜ","蓝":"lán","黄":"huáng","紫":"zǐ","左":"zuǒ",
  "右":"yòu","夏":"xià","秋":"qiū","冬":"dōng","笔":"bǐ","纸":"zhǐ","刀":"dāo","枪":"qiāng","剑":"jiàn","弓":"gōng",
  "铁":"tiě","铜":"tóng","银":"yín","帅":"shuài","兵":"bīng","跳":"tiào"
};

function getPinyin(char: string, mode: PinyinMode): string {
  const py = PINYIN_MAP[char];
  if (!py) return char;

  switch (mode) {
    case "tone":
      return py;
    case "notone":
      return py.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, (m) => {
        const map: Record<string, string> = {
          "ā":"a","á":"a","ǎ":"a","à":"a","ē":"e","é":"e","ě":"e","è":"e",
          "ī":"i","í":"i","ǐ":"i","ì":"i","ō":"o","ó":"o","ǒ":"o","ò":"o",
          "ū":"u","ú":"u","ǔ":"u","ù":"u","ǖ":"v","ǘ":"v","ǚ":"v","ǜ":"v",
        };
        return map[m] || m;
      });
    case "initial":
      return py[0].toUpperCase();
    default:
      return py;
  }
}

function convertPinyin(text: string, mode: PinyinMode, separator: string): string {
  return text
    .split("")
    .map((ch) => {
      if (/[\u4e00-\u9fa5]/.test(ch)) {
        return getPinyin(ch, mode);
      }
      return ch;
    })
    .join(separator === " " ? " " : separator);
}

export function PinyinTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<PinyinMode>("tone");
  const [separator, setSeparator] = useState(" ");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const result = useMemo(() => convertPinyin(input, mode, separator), [input, mode, separator]);

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-sm">模式</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as PinyinMode)}>
            <SelectTrigger className="w-36 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tone">带声调</SelectItem>
              <SelectItem value="notone">无声调</SelectItem>
              <SelectItem value="initial">首字母</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">分隔符</Label>
          <Select value={separator} onValueChange={(v) => v !== null && setSeparator(v)}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">空格</SelectItem>
              <SelectItem value="">无</SelectItem>
              <SelectItem value="-">连字符</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>输入中文</Label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入中文汉字..."
            className="min-h-[200px] text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>拼音结果</Label>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(result, "result")} disabled={!result}>
              {copiedField === "result" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedField === "result" ? "已复制" : "复制"}
            </Button>
          </div>
          <Textarea value={result} readOnly className="min-h-[200px] text-sm font-mono" />
        </div>
      </div>
    </div>
  );
}
