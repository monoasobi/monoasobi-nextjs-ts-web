import { Music } from "@appTypes/music";
import { adminAtom } from "@atoms/admin.atom";
import { sidebarAtom } from "@atoms/sidebar.atom";
import { musics } from "@lib/music";
import { novels } from "@lib/novel";
import { Flex, ScrollArea, Text, Badge } from "@radix-ui/themes";
import { useAtomValue, useSetAtom } from "jotai";
import { MouseEventHandler, useEffect, useRef } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import styled from "styled-components";

const SIDEBAR_WIDTH = "360px";
const MOBILE_SIDEBAR_WIDTH = 360;

const Container = styled.aside<{ $open: boolean }>`
  width: ${({ $open }) => ($open ? SIDEBAR_WIDTH : "0")};
  flex: 0 0 ${({ $open }) => ($open ? SIDEBAR_WIDTH : "0")};
  height: calc(100dvh - 56px);
  background-color: var(--gray-2);
  border-right: 0;
  overflow: hidden;
  pointer-events: ${({ $open }) => ($open ? "auto" : "none")};
  transition:
    width 0.18s ease,
    flex-basis 0.18s ease;

  @media (max-width: 1024px) {
    position: fixed;
    left: 0;
    top: 56px;
    z-index: 20;
    width: min(${MOBILE_SIDEBAR_WIDTH}px, 100dvw);
    flex-basis: min(${MOBILE_SIDEBAR_WIDTH}px, 100dvw);
    transform: translateX(${({ $open }) => ($open ? "0" : "-100%")});
    pointer-events: auto;
    transition: transform 0.18s ease;
  }
`;

const Overlay = styled.div<{ $open: boolean }>`
  display: none;

  @media (max-width: 1024px) {
    display: ${({ $open }) => ($open ? "block" : "none")};
    position: fixed;
    inset: 56px 0 0;
    z-index: 15;
    background-color: var(--black-a6);
  }
`;

const SidebarShell = styled(Flex)`
  height: 100%;
`;

const Content = styled(ScrollArea)`
  flex: 1;
  min-height: 0;
  padding: 0;
`;

export const Sidebar = () => {
  const isSidebar = useAtomValue(sidebarAtom);
  const setIsSidebar = useSetAtom(sidebarAtom);
  const param = useParams();
  const location = useLocation();

  const sideRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isSidebar) return;

      const width = window.innerWidth;
      if (
        sideRef.current &&
        !sideRef.current.contains(event.target as Node) &&
        width < 1024
      ) {
        setIsSidebar(false);
      }
    };

    const scrollTop = sessionStorage.getItem("sidebar");

    if (scrollTop) sideRef.current?.scrollTo({ top: Number(scrollTop) - 100 });

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isSidebar, setIsSidebar]);

  const items = musics
    .map((music) => ({
      music,
      novel: novels.find((novel) => novel.musicId === music.id),
    }))
    .filter(({ novel }) => novel);

  return (
    <>
      <Overlay $open={isSidebar} onClick={() => setIsSidebar(false)} />
      <Container $open={isSidebar} ref={sideRef}>
        <SidebarShell direction="column">
          <Content scrollbars="vertical">
            <Flex direction="column" gap="1" p="0">
              {items.map(({ music, novel }) => (
                <Item
                  item={music}
                  key={music.id}
                  isActive={
                    music.specialPath
                      ? location.pathname.includes(music.specialPath)
                      : param.id === String(novel?.id)
                  }
                />
              ))}
            </Flex>
          </Content>
        </SidebarShell>
      </Container>
    </>
  );
};

const ItemContainer = styled(Link)<{ $active: boolean }>`
  position: relative;
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
  min-height: 64px;
  padding: 8px 16px;
  color: var(--gray-12);
  background-color: ${({ $active }) =>
    $active ? "var(--red-a3)" : "transparent"};
  transition: background-color 0.12s ease;

  &:hover {
    background-color: ${({ $active }) =>
      $active ? "var(--red-a4)" : "var(--gray-a3)"};
  }

  @media (max-width: 359px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

interface ItemProps {
  item: Music;
  isActive: boolean;
}

const Artwork = styled.img`
  width: 72px;
  grid-column: 1;
  border-radius: 4px;
  grid-row: 1;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border: 1px solid var(--gray-a5);
  background-color: var(--gray-3);

  @media (max-width: 359px) {
    display: none;
  }
`;

type ItemTone = "active" | "available" | "untranslated";

const toneColorMap: Record<ItemTone, string> = {
  active: "var(--red-11)",
  available: "var(--gray-12)",
  untranslated: "var(--gray-10)",
};

const ItemText = styled(Flex)`
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  overflow: hidden;

  @media (max-width: 359px) {
    grid-column: 1;
  }
`;

const TextRow = styled(Flex)`
  min-width: 0;
  max-width: 100%;
`;

const PrimaryText = styled(Text)<{ $tone: ItemTone }>`
  display: block;
  color: ${({ $tone }) => toneColorMap[$tone]};
  min-width: 0;
  max-width: 100%;
`;

const SecondaryText = styled(Text)<{ $tone: ItemTone }>`
  display: block;
  color: ${({ $tone }) =>
    $tone === "active" ? "var(--red-10)" : "var(--gray-11)"};
  min-width: 0;
  max-width: 100%;
`;

const Item = ({ item, isActive }: ItemProps) => {
  const { id, korTitle, title, enTitle, specialPath } = item;
  const setIsSidebar = useSetAtom(sidebarAtom);
  const isAdmin = useAtomValue(adminAtom);

  const novel = novels.find((novel) => novel.musicId === id);
  if (!novel) return null;
  const { isPublished, translated, title: novelTitle } = novel;
  const closeHandler: MouseEventHandler<HTMLAnchorElement> = (e) => {
    const width = window.innerWidth;
    if (width < 1024) setIsSidebar(false);
    sessionStorage.setItem("sidebar", e.currentTarget.offsetTop.toString());
  };

  const to = specialPath ? `/${specialPath}` : `/novel/${novel.id}`;
  const tone: ItemTone = isActive
    ? "active"
    : specialPath || translated || isPublished
      ? "available"
      : "untranslated";
  const showPublishedBadge = isPublished && !isAdmin && !specialPath;

  return (
    <ItemContainer
      to={to}
      onClick={closeHandler}
      title={`${title} - ${korTitle} / ${enTitle}`}
      $active={isActive}
    >
      <Artwork src={`/images/albumart/${item.id}.webp`} alt={item.title} />
      <ItemText direction="column" gap="1">
        <TextRow align="center" gap="1">
          <PrimaryText size="3" weight="bold" truncate $tone={tone}>
            {title}
          </PrimaryText>
          {showPublishedBadge && <Badge size="1">정식 발매</Badge>}
        </TextRow>
        <SecondaryText size="1" weight="bold" truncate $tone={tone}>
          {korTitle} / {enTitle}
        </SecondaryText>
        {novelTitle && (
          <SecondaryText size="1" truncate $tone={tone}>
            &lt;{novelTitle}&gt;
          </SecondaryText>
        )}
      </ItemText>
    </ItemContainer>
  );
};
